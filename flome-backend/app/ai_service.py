# app/ai_service.py
import json
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 모델 설정 (재시도 횟수 제한으로 빠른 피드백)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7, max_retries=1)

def generate_bouquet_recipe(db: Session, user_situation: str):
    """
    2단계 RAG 방식 적용: AI 아이디어 도출 -> DB 재고 매칭 -> 최종 결과 생성
    스트리밍 방식으로 진행 상황과 결과를 반환함.
    """
    
    # --- Step 1: AI에게 상황에 맞는 꽃 이름 추천받기 ---
    yield json.dumps({"type": "progress", "message": "AI가 상황을 분석하여 꽃 후보를 선정하고 있습니다..."}) + "\n"
    
    ideation_template = """
    사용자 상황: "{situation}"
    
    이 상황에 가장 잘 어울리고 꽃말이 적절한 꽃 종류를 **최대한 다양하게 20가지 정도** 추천해주세요.
    **메인 꽃, 서브 꽃, 그리고 받쳐주는 소재(잎, 안개꽃 등)**를 골고루 포함해야 합니다.
    설명 없이 오직 한국어 꽃 이름만 쉼표(,)로 구분해서 나열하세요.
    예시: 장미, 튤립, 리시안셔스, 프리지아, 안개꽃, 유칼립투스, 작약, 수국, 카네이션, 백합, 거베라, 라넌큘러스, 아네모네, 스토크, 왁스플라워, 루스커스, 아이비, 델피늄, 스타치스, 천일홍
    """
    ideation_prompt = ChatPromptTemplate.from_template(ideation_template)
    ideation_chain = ideation_prompt | llm | StrOutputParser()
    
    try:
        recommended_names_str = ideation_chain.invoke({"situation": user_situation})
        recommended_names = [name.strip() for name in recommended_names_str.split(',') if name.strip()]
        print(f"AI 1차 추천: {recommended_names}")
    except Exception as e:
        error_str = str(e)
        print(f"AI 1차 추천 실패: {error_str}")
        
        # 429 Quota 에러 등 치명적 오류 시 즉시 중단
        if "429" in error_str or "quota" in error_str.lower() or "resource exhausted" in error_str.lower():
            error_result = {
                "title": "AI 사용량 초과",
                "color_theme": "알 수 없음",
                "flowers": [],
                "letter": "죄송합니다. 현재 AI 서비스 사용량이 폭주하여 일시적으로 이용이 불가능합니다. 잠시 후 다시 시도해주세요.",
                "care_guide": [],
                "available_stores": []
            }
            yield json.dumps({"type": "result", "data": error_result}) + "\n"
            return # 여기서 함수 종료

        recommended_names = [] # 그 외 에러는 빈 리스트로 Fallback 진행

    # --- Step 2: DB에서 재고 확인 및 필터링 ---
    yield json.dumps({"type": "progress", "message": "각 매장의 실시간 꽃 재고를 확인하고 있습니다..."}) + "\n"
    
    matched_flowers = []
    if recommended_names:
        for name in recommended_names:
            flowers = db.query(models.Flower).join(models.Stock).filter(
                models.Flower.name.like(f"%{name}%"),
                models.Stock.quantity > 0,
                models.Stock.status == models.StockStatus.AVAILABLE
            ).all()
            matched_flowers.extend(flowers)
    
    matched_flowers = list({f.flower_id: f for f in matched_flowers}.values())

    # --- Step 3: 매칭된 꽃이 너무 적으면 Fallback ---
    if len(matched_flowers) < 2:
        print("매칭된 꽃이 부족하여 인기/기본 재고를 추가합니다.")
        fallback_flowers = db.query(models.Flower).join(models.Stock).filter(
            models.Stock.quantity > 0,
            models.Stock.status == models.StockStatus.AVAILABLE
        ).limit(5).all()
        
        existing_ids = {f.flower_id for f in matched_flowers}
        for f in fallback_flowers:
            if f.flower_id not in existing_ids:
                matched_flowers.append(f)

    # --- [Safety Limit] 토큰 폭탄 방지를 위해 후보군 최대 8개로 제한 ---
    if len(matched_flowers) > 8:
        print(f"매칭된 꽃이 너무 많아({len(matched_flowers)}개) 상위 8개로 제한합니다.")
        matched_flowers = matched_flowers[:8]

    if not matched_flowers:
        error_result = {
            "title": "재고 없음",
            "color_theme": "알 수 없음",
            "flowers": [],
            "letter": "죄송합니다. 현재 추천드릴 수 있는 꽃 재고가 없습니다.",
            "care_guide": [],
            "available_stores": []
        }
        yield json.dumps({"type": "result", "data": error_result}) + "\n"
        return

    # --- Step 4: 최종 생성 ---
    yield json.dumps({"type": "progress", "message": "확인된 재고로 최적의 꽃다발과 편지를 작성 중입니다..."}) + "\n"

    flower_inventory = ""
    for f in matched_flowers:
        flower_inventory += f"- {f.name} (색상: {f.color}, 꽃말: {f.meaning}, 관리특이사항: {f.care_guide})\n"

    template = """
    당신은 'FloMe'의 수석 플로리스트 AI입니다.
    사용자 상황을 분석하여 꽃다발 레시피를 설계하고, 고객이 전할 편지를 대신 작성해줍니다.
    
    [사용 가능한 꽃 후보 (재고 보유)]
    {inventory}

    [사용자 상황]
    {situation}

    **[작업 지시사항]**
    1. **구성**: 위 [사용 가능한 꽃 후보] 목록 중에서만 선택하여 '메인 - 서브 - 소재' 구성을 만드세요.
    2. **색감**: 상황과 감정에 어울리는 '컬러 테마'를 정하세요.
    3. **관리법**: 선택된 꽃들의 핵심 관리법 3가지를 정리하세요.
    
    4. **편지 (가장 중요!)**: 
       - 선택한 꽃들의 '꽃말(의미)'을 문장에 자연스럽게 녹여서 작성하세요.
       - **🚨 제약조건: 편지 본문에 '장미', '튤립' 같은 꽃 이름이 절대 등장하면 안 됩니다.**
       - **🚨 제약조건: '이 꽃의 꽃말처럼...' 같은 설명조의 말투도 금지입니다.**
       - 오직 상대방에게 전하는 진심 어린 메시지로만 구성하세요.

    **반드시 아래 JSON 형식으로만 답변하세요. (마크다운 포맷 금지, 순수 JSON만 출력)**
    {{
        "title": "꽃다발 이름",
        "color_theme": "컬러 테마 설명",
        "flowers": [
            {{"role": "메인", "name": "꽃이름", "reason": "선택 이유"}},
            {{"role": "서브", "name": "꽃이름", "reason": "선택 이유"}},
            {{"role": "소재", "name": "꽃이름", "reason": "선택 이유"}}
        ],
        "letter": "꽃 이름 없이 의미만 담은 감동적인 편지 (공백 포함 150자 이내)",
        "care_guide": [
            "관리법 1",
            "관리법 2",
            "관리법 3"
        ]
    }}
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    
    try:
        response_text = chain.invoke({
            "inventory": flower_inventory,
            "situation": user_situation
        })
        
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(cleaned_text)

        # 3. 추천된 꽃들을 재고로 가진 가게 필터링
        recommended_flower_names = [flower_info["name"] for flower_info in result_json["flowers"]]
        
        required_flower_ids = []
        for flower_name in recommended_flower_names:
            flower = db.query(models.Flower).filter(models.Flower.name == flower_name).first()
            if not flower:
                flower = db.query(models.Flower).filter(models.Flower.name.like(f"%{flower_name}%")).first()
            if flower:
                required_flower_ids.append(flower.flower_id)
        
        if not required_flower_ids:
             required_flower_ids = [f.flower_id for f in matched_flowers[:3]]

        # 모든 필수 꽃을 재고로 가진 가게 찾기
        # 먼저, 각 가게가 어떤 꽃들을 충분히 재고로 가지고 있는지 집계
        stores_with_stock = db.query(
            models.Stock.store_id,
            models.Stock.flower_id,
            func.sum(models.Stock.quantity).label("total_quantity")
        ).filter(
            models.Stock.flower_id.in_(required_flower_ids),
            models.Stock.quantity > 0,
            models.Stock.status == models.StockStatus.AVAILABLE
        ).group_by(models.Stock.store_id, models.Stock.flower_id).all()

        # 각 가게별로 필요한 모든 꽃을 가지고 있는지 확인
        eligible_store_ids = []
        store_stock_map = {} 

        for stock_info in stores_with_stock:
            store_id = stock_info.store_id
            flower_id = stock_info.flower_id
            quantity = stock_info.total_quantity

            if store_id not in store_stock_map:
                store_stock_map[store_id] = {}
            store_stock_map[store_id][flower_id] = quantity
        
        for store_id, stock_data in store_stock_map.items():
            has_all_flowers = True
            for required_id in required_flower_ids:
                if required_id not in stock_data or stock_data[required_id] <= 0:
                    has_all_flowers = False
                    break
            if has_all_flowers:
                eligible_store_ids.append(store_id)
        
        # --- NameError 방지를 위해 항상 초기화 ---
        # 이 부분이 변경되어야 합니다.
        
        available_stores_data = [] # available_stores 변수 대신 이 변수를 사용
        
        # eligible_store_ids에 해당하는 가게 정보 조회
        if eligible_store_ids: # eligible_store_ids가 있을 때만 쿼리 실행
            available_stores_query_result = db.query(models.Store).filter(models.Store.store_id.in_(eligible_store_ids)).all()
            
            for store in available_stores_query_result:
                product = db.query(models.Product).filter(
                    models.Product.store_id == store.store_id,
                    models.Product.type == models.ProductType.CUSTOM
                ).first()
                
                if not product:
                    product = db.query(models.Product).filter(
                        models.Product.store_id == store.store_id
                    ).first()
                
                store_data = {
                    "store_id": str(store.store_id), 
                    "name": store.name, 
                    "address": store.address
                }
                
                if product:
                    store_data["product_id"] = str(product.product_id)
                    store_data["product_price"] = product.price
                
                available_stores_data.append(store_data)
        
        result_json["available_stores"] = available_stores_data

        # --- Schema Validation ---
        defaults = {
            "title": "추천 꽃다발",
            "color_theme": "자연스러운 색감",
            "flowers": [],
            "letter": "편지 내용을 생성하지 못했습니다.",
            "care_guide": [],
            "available_stores": []
        }
        
        for key, default_val in defaults.items():
            if key not in result_json or result_json[key] is None:
                result_json[key] = default_val

        if isinstance(result_json["care_guide"], str):
            result_json["care_guide"] = [result_json["care_guide"]]
            
        valid_flowers = []
        for f in result_json["flowers"]:
            if isinstance(f, dict):
                valid_flowers.append({
                    "role": f.get("role", "추천 꽃"),
                    "name": f.get("name", "꽃 이름 없음"),
                    "reason": f.get("reason", "추천 이유 없음")
                })
        result_json["flowers"] = valid_flowers

        # 최종 결과 전송
        yield json.dumps({"type": "result", "data": result_json}) + "\n"

    except Exception as e:
        print(f"AI 응답 파싱 실패 또는 로직 오류: {e}")
        error_result = {
            "title": "오류 발생",
            "color_theme": "알 수 없음",
            "letter": "죄송합니다. 일시적인 오류로 편지를 생성하지 못했습니다.",
            "flowers": [],
            "care_guide": [],
            "available_stores": []
        }
        yield json.dumps({"type": "result", "data": error_result}) + "\n"