# app/ai_service.py
import json
from sqlalchemy.orm import Session
from app import models
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

# 모델 설정
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

def generate_bouquet_recipe(db: Session, user_situation: str):
    """
    꽃 이름을 숨기고 의미만으로 편지를 작성하는 업그레이드된 레시피 생성기
    """
    
    # 1. 재고 조회
    flowers = db.query(models.Flower).all()
    if not flowers:
        return {"error": "꽃 데이터가 없습니다."}

    # AI에게 줄 정보 (색상, 꽃말, 관리법 포함)
    flower_inventory = ""
    for f in flowers:
        flower_inventory += f"- {f.name} (색상: {f.color}, 꽃말: {f.meaning}, 관리특이사항: {f.care_guide})\n"
    
    # 2. 프롬프트 작성 (편지 작성 조건 강화)
    template = """
    당신은 'FloMe'의 수석 플로리스트 AI입니다.
    사용자 상황을 분석하여 꽃다발 레시피를 설계하고, 고객이 전할 편지를 대신 작성해줍니다.
    
    [보유 꽃 목록]
    {inventory}

    [사용자 상황]
    {situation}

    **[작업 지시사항]**
    1. **구성**: '메인 - 서브 - 소재'의 3단 구성을 갖추세요. (상황에 어울리는 꽃이 없다면 의미가 가장 가까운 것을 선택하세요)
    2. **색감**: 상황과 감정에 어울리는 '컬러 테마'를 정하세요.
    3. **관리법**: 선택된 꽃들의 핵심 관리법 3가지를 정리하세요.
    
    4. **편지 (가장 중요!)**: 
       - 선택한 꽃들의 '꽃말(의미)'을 문장에 자연스럽게 녹여서 작성하세요.
       - **🚨 제약조건: 편지 본문에 '장미', '튤립' 같은 꽃 이름이 절대 등장하면 안 됩니다.**
       - **🚨 제약조건: '이 꽃의 꽃말처럼...' 같은 설명조의 말투도 금지입니다.**
       - 오직 상대방에게 전하는 진심 어린 메시지로만 구성하세요.
       - (예시: '장미(열정)'를 썼다면 -> "당신을 향한 제 마음은 여전히 뜨겁게 타오르고 있어요.")

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
        return result_json

    except Exception as e:
        print(f"AI 응답 파싱 실패: {e}")
        return {
            "title": "오류 발생",
            "letter": "죄송합니다. 편지를 생성하지 못했습니다.",
            "flowers": [],
            "care_guide": []
        }