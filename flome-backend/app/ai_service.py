# app/ai_service.py
import json
import random
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from app import models
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 모델 설정 (Gemini 2.5 Flash 사용, 1회 호출 시도)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", temperature=0.7, max_retries=1)

# --- Fallback용 데이터 (API 에러/한도 초과 시 사용) ---
MOCK_RECOMMENDED_FLOWERS = [
    "장미", "튤립", "백합", "수국", "카네이션", "안개꽃", "유칼립투스", 
    "프리지아", "작약", "라넌큘러스", "리시안셔스", "해바라기", "거베라"
]

MOCK_LETTER_TEMPLATES = [
    "꽃이 피어나는 것처럼 당신의 하루도 활짝 피어나길 바랍니다. 언제나 응원하고 있어요.",
    "특별한 날은 아니지만, 문득 당신 생각이 나서 꽃을 보냅니다. 당신의 일상이 꽃향기처럼 향긋하고 아름답기를 소망합니다.",
    "말로는 다 전하지 못하는 마음을 이 꽃들에 담아 보냅니다. 변치 않는 아름다움처럼 저의 마음도 항상 당신 곁에 머물고 있다는 걸 잊지 마세요.",
    "소중한 당신에게 가장 아름다운 순간을 선물하고 싶었습니다. 이 꽃들이 당신에게 작은 위로와 기쁨이 되기를 진심으로 바랍니다."
]

def generate_mock_bouquet_recipe(db: Session, user_situation: str):
    """
    API 한도 초과(429) 시 실행되는 비상용 Fallback 로직.
    AI 없이 DB 재고 기반으로 랜덤 추천을 생성합니다.
    """
    yield json.dumps({"type": "progress", "message": "AI 사용량이 많아 대체 로직으로 전환합니다..."}) + "\n"
    
    # 1. DB에서 가용 재고가 있는 매장 아무거나 하나 선택 (물량 많은 순)
    top_store = db.query(
        models.Stock.store_id, 
        func.count(models.Stock.flower_id).label('flower_count')
    ).filter(
        models.Stock.quantity > 0,
        models.Stock.status == models.StockStatus.AVAILABLE
    ).group_by(models.Stock.store_id).order_by(desc('flower_count')).first()
    
    if not top_store:
        error_result = {
            "title": "재고 없음",
            "color_theme": "알 수 없음",
            "flowers": [],
            "letter": "현재 주문 가능한 꽃집이 없습니다.",
            "care_guide": [],
            "available_stores": []
        }
        yield json.dumps({"type": "result", "data": error_result}) + "\n"
        return

    target_store_id = top_store.store_id
    
    # 2. 그 매장의 꽃 목록 조회
    store_stocks = db.query(models.Stock).options(joinedload(models.Stock.flower)).filter(
        models.Stock.store_id == target_store_id,
        models.Stock.quantity > 0,
        models.Stock.status == models.StockStatus.AVAILABLE
    ).all()
    
    available_flowers = [stock.flower for stock in store_stocks if stock.flower]
    
    if not available_flowers:
        # 혹시라도 꽃 정보가 없으면
        yield json.dumps({"type": "result", "data": {"title": "오류", "letter": "매장 정보를 불러오지 못했습니다."}}) + "\n"
        return

    # 3. 랜덤 선택 (최대 3개)
    selected_flowers = random.sample(available_flowers, min(len(available_flowers), 3))
    
    # 4. 결과 JSON 구성
    roles = ["메인", "서브", "소재"]
    flower_list_json = []

    for i, flower in enumerate(selected_flowers):
        role = roles[i] if i < len(roles) else "기타"
        flower_list_json.append({
            "role": role,
            "name": flower.name,
            "reason": f"{flower.name}의 꽃말은 '{flower.meaning or '아름다움'}'입니다. 당신의 마음에 닿기를 바랍니다."
        })

    # 매장 정보 조회
    store_obj = db.query(models.Store).filter(models.Store.store_id == target_store_id).first()
    product = db.query(models.Product).filter(
        models.Product.store_id == target_store_id,
        models.Product.type == models.ProductType.CUSTOM
    ).first() or db.query(models.Product).filter(
        models.Product.store_id == target_store_id
    ).first()

    store_data = {
        "store_id": str(store_obj.store_id),
        "name": store_obj.name,
        "address": store_obj.address
    }
    if product:
        store_data["product_id"] = str(product.product_id)
        store_data["product_price"] = product.price

    result_json = {
        "title": f"{store_obj.name}의 추천 꽃다발",
        "color_theme": "따뜻하고 화사한 파스텔 톤",
        "flowers": flower_list_json,
        "letter": random.choice(MOCK_LETTER_TEMPLATES),
        "care_guide": [
            "줄기 끝을 사선으로 잘라 물 흡수 면적을 넓혀주세요.",
            "매일 시원한 물로 갈아주면 더 오래 볼 수 있습니다.",
            "직사광선을 피하고 서늘한 곳에 보관하세요."
        ],
        "available_stores": [store_data]
    }
    
    yield json.dumps({"type": "result", "data": result_json}) + "\n"


def generate_bouquet_recipe(db: Session, user_situation: str):
    """
    1단계 최적화: 상위 매장들의 재고를 AI에게 제공 -> AI가 매장과 꽃을 동시 선택 (1 Request)
    """
    
    # --- Step 1: 꽃 종류가 다양한 상위 5개 매장 선정 ---
    yield json.dumps({"type": "progress", "message": "꽃 종류가 다양한 우수 매장들을 선별하고 있습니다..."}) + "\n"
    
    top_stores = db.query(
        models.Stock.store_id, 
        func.count(models.Stock.flower_id).label('flower_count')
    ).filter(
        models.Stock.quantity > 0,
        models.Stock.status == models.StockStatus.AVAILABLE
    ).group_by(models.Stock.store_id).order_by(desc('flower_count')).limit(5).all()
    
    if not top_stores:
        yield from generate_mock_bouquet_recipe(db, user_situation)
        return

    top_store_ids = [s.store_id for s in top_stores]

    # --- Step 2: 각 매장의 재고 정보 조회 및 포맷팅 ---
    # 쿼리 효율화를 위해 한번에 조회
    stocks = db.query(models.Stock).options(
        joinedload(models.Stock.flower),
        joinedload(models.Stock.store)
    ).filter(
        models.Stock.store_id.in_(top_store_ids),
        models.Stock.quantity > 0,
        models.Stock.status == models.StockStatus.AVAILABLE
    ).all()

    # 매장별 인벤토리 구성
    store_inventory_map = {}
    store_info_map = {}

    for stock in stocks:
        s_id = str(stock.store_id)
        if s_id not in store_inventory_map:
            store_inventory_map[s_id] = []
            store_info_map[s_id] = stock.store.name # 매장 이름 저장
        
        # 꽃 정보 추가 (중복 방지)
        if stock.flower:
            flower_info = f"{stock.flower.name}(꽃말:{stock.flower.meaning or '없음'})"
            if flower_info not in store_inventory_map[s_id]:
                store_inventory_map[s_id].append(flower_info)

    # 프롬프트에 넣을 인벤토리 텍스트 생성
    inventory_text = ""
    for s_id, flowers in store_inventory_map.items():
        if len(flowers) >= 3: # 최소 3종류 이상 있는 매장만 후보로
            store_name = store_info_map[s_id]
            inventory_text += f"- 매장ID [{s_id}] ({store_name}): {', '.join(flowers)}\n"

    if not inventory_text:
        yield from generate_mock_bouquet_recipe(db, user_situation)
        return

    # --- Step 3: AI 생성 요청 (Single Call) ---
    yield json.dumps({"type": "progress", "message": "가장 적합한 매장을 골라 꽃다발을 디자인하고 있습니다..."}) + "\n"

    template = """
    당신은 'FloMe'의 수석 플로리스트 AI입니다.
    고객의 상황에 맞춰, 아래 제공된 매장들 중 **단 하나의 매장을 선택**하고, **그 매장이 보유한 꽃들로만** 꽃다발을 디자인하세요.

    [후보 매장 및 보유 꽃 목록]
    {inventory}

    [고객의 상황]
    "{situation}"

    **[작업 지시사항]**
    1. **매장 선택**: 위 목록 중 고객 상황에 가장 어울리는 꽃을 보유한 매장 **하나를 선택**하세요. (반드시 ID를 기억하세요)
    2. **구성**: **선택한 매장의 보유 꽃 목록에 있는 꽃으로만** '메인 - 서브 - 소재'를 구성하세요. (목록에 없는 꽃 절대 금지)
    3. **편지**: 
       - 선택한 꽃들의 꽃말을 활용해 감동적인 편지를 쓰세요. (150자 이내)
       - **🚨 제약: 편지 본문에 구체적인 꽃 이름(장미, 튤립 등)이나 '꽃말처럼' 같은 설명조를 절대 넣지 마세요.**
    4. **출력**: 선택한 '매장ID'를 반드시 포함하여 JSON으로 출력하세요.

    **반드시 아래 JSON 형식으로만 답변하세요. (마크다운 없이 순수 JSON만)**
    {{
        "selected_store_id": "선택한 매장의 ID (대괄호 제외, UUID 형식)",
        "title": "꽃다발 이름",
        "color_theme": "컬러 테마 설명",
        "flowers": [
            {{"role": "메인", "name": "꽃이름", "reason": "선택 이유"}},
            {{"role": "서브", "name": "꽃이름", "reason": "선택 이유"}},
            {{"role": "소재", "name": "꽃이름", "reason": "선택 이유"}}
        ],
        "letter": "편지 내용",
        "care_guide": ["관리법1", "관리법2", "관리법3"]
    }}
    """
    
    prompt = ChatPromptTemplate.from_template(template)
    chain = prompt | llm | StrOutputParser()
    
    try:
        response_text = chain.invoke({
            "inventory": inventory_text,
            "situation": user_situation
        })
        
        # JSON 파싱
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()
        result_json = json.loads(cleaned_text)

        # 4. 선택된 매장 정보 매핑
        selected_store_id = result_json.get("selected_store_id")
        
        # 매장 정보 조회
        store_obj = db.query(models.Store).filter(models.Store.store_id == selected_store_id).first()
        
        if not store_obj:
            # AI가 없는 ID를 뱉었거나 형식이 잘못된 경우 -> Mock으로 Fallback 또는 첫 번째 매장 강제 매핑
            # 여기서는 안전하게 Mock으로
            print(f"AI Selected Invalid Store ID: {selected_store_id}")
            yield from generate_mock_bouquet_recipe(db, user_situation)
            return

        product = db.query(models.Product).filter(
            models.Product.store_id == store_obj.store_id,
            models.Product.type == models.ProductType.CUSTOM
        ).first() or db.query(models.Product).filter(
            models.Product.store_id == store_obj.store_id
        ).first()
        
        store_data = {
            "store_id": str(store_obj.store_id),
            "name": store_obj.name,
            "address": store_obj.address
        }
        if product:
            store_data["product_id"] = str(product.product_id)
            store_data["product_price"] = product.price
            
        # 결과에 매장 정보 주입
        result_json["available_stores"] = [store_data]
        
        # flowers 데이터 정제 (혹시 모를 오류 방지)
        if "flowers" not in result_json:
             result_json["flowers"] = []

        # 최종 결과 전송
        yield json.dumps({"type": "result", "data": result_json}) + "\n"

    except Exception as e:
        error_str = str(e)
        print(f"AI 호출 실패: {error_str}")
        print("Switching to Mock Logic due to error.")
        yield from generate_mock_bouquet_recipe(db, user_situation)