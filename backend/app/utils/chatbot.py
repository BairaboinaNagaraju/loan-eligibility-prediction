import re
import json
from typing import Optional
from sqlalchemy.orm import Session
from app.models.application import LoanApplication
from app.models.user import User


def generate_bot_response(message: str, user: Optional[User] = None, db: Optional[Session] = None) -> str:
    message = message.lower().strip()

    # Contextual check: user's last application status
    last_app = None
    if user and db:
        last_app = db.query(LoanApplication).filter(LoanApplication.user_id == user.id)\
            .order_by(LoanApplication.created_at.desc()).first()

    # Intent mapping
    if any(k in message for k in ["hello", "hi", "hey", "greetings", "good morning", "good afternoon"]):
        name = (user.full_name or user.username) if user else "valued customer"
        greeting = (
            f"Hello {name}! I'm your AI Financial Assistant at Vertex Bank. "
            "How can I help you with your loan eligibility or calculations today?"
        )
        if last_app:
            greeting += (
                f"\n\nI see your latest application for a loan of **${last_app.loan_amount:,.0f}k** "
                f"is currently **{last_app.status}**. Feel free to ask me anything about it!"
            )
        return greeting

    elif any(k in message for k in ["how to apply", "apply for loan", "apply now", "start application", "new loan"]):
        return (
            "To apply for a loan, navigate to the **Apply for Loan** tab in the dashboard. "
            "You'll fill in your financial and demographic details through a guided 3-step form — "
            "including your income, requested loan amount, and credit history. "
            "Our AI model analyzes your profile and delivers an eligibility prediction **instantly**!"
        )

    elif any(k in message for k in ["my application", "application status", "my status", "why rejected", "why approved", "loan status"]):
        if not user:
            return "Please **log in** to check your active loan application status."
        if not last_app:
            return (
                "You haven't submitted any loan applications yet. "
                "Head over to the **Apply for Loan** page to submit your first application!"
            )

        status_str = f"Your latest application **(ID: #{last_app.id})** status is **{last_app.status}**.\n\n"
        if last_app.prediction == "Approved":
            status_str += (
                f"Our AI model predicted **Approval** with a confidence score of "
                f"**{last_app.confidence_score * 100:.1f}%**. "
                "This is largely due to factors like your positive credit history and sufficient income coverage."
            )
        else:
            status_str += (
                f"Our AI model predicted **Rejection** with a confidence score of "
                f"**{last_app.confidence_score * 100:.1f}%**.\n\n"
            )
            if last_app.rejection_reasons:
                try:
                    reasons = json.loads(last_app.rejection_reasons)
                    status_str += "**Key Factors:**\n" + "\n".join([f"- {r}" for r in reasons[:3]])
                except Exception:
                    status_str += f"**Factors:** {last_app.rejection_reasons}"
            status_str += (
                "\n\n**Actionable Advice:** Consider reducing your requested amount, "
                "adding a co-applicant to boost combined income, or resolving active credit defaults."
            )
        return status_str

    elif any(k in message for k in ["improve eligibility", "increase chance", "better score", "eligibility advice", "how to qualify", "improve chances"]):
        return (
            "Here are the **top strategies** to improve your loan approval probability:\n\n"
            "1. **Improve Credit History** — Ensure all previous loan obligations and credit cards are paid on time. "
            "Credit history is the strongest predictor in our model.\n"
            "2. **Lower the Requested Amount** — Aim for a Debt-to-Income ratio where monthly payments are under 40% of income.\n"
            "3. **Add a Co-Applicant** — Combining incomes with a spouse or relative increases your debt service coverage ratio.\n"
            "4. **Extend the Loan Term** — Opting for a 30-year (360-month) term instead of a 15-year term reduces monthly payments.\n"
            "5. **Choose Semiurban Property** — Statistically, Semiurban properties show the highest approval rates in our dataset."
        )

    elif any(k in message for k in ["interest rate", "rates", "apr", "current rate"]):
        return (
            "Vertex Bank offers competitive interest rates based on your credit profile:\n\n"
            "- **Prime Rate** (Credit History = 1.0): Starting from **5.75% to 6.50% APR**\n"
            "- **Standard Rate**: **7.00% to 8.50% APR**\n"
            "- **High-Risk Rate**: **9.50%+ APR** (credit history concerns)\n\n"
            "You can test rates using our **EMI Calculator** on the Home page."
        )

    elif any(k in message for k in ["calculate emi", "emi calculator", "monthly payment", "monthly installment"]):
        return (
            "We have built-in calculators to help you plan your loan!\n\n"
            "- **EMI Calculator** on the Home page — see your monthly principal & interest payment\n"
            "- **Affordability Calculator** — estimate the maximum loan size you can comfortably qualify for\n\n"
            "Formula: **EMI = P × r × (1+r)^n / ((1+r)^n - 1)**\n"
            "where P = principal, r = monthly rate, n = number of months."
        )

    elif any(k in message for k in ["credit history", "credit score", "what is credit", "credit rating"]):
        return (
            "**Credit History** in our system indicates whether you have met your past credit obligations:\n\n"
            "- **1.0 (Good)** — You have a proven track record of timely repayments\n"
            "- **0.0 (Bad/None)** — You have defaults, late payments, or no credit history\n\n"
            "A good credit history is the **single strongest factor** in loan approval. "
            "It typically boosts approval probability by 30–40% compared to applicants with poor history."
        )

    elif any(k in message for k in ["what is emi", "what does emi mean", "define emi"]):
        return (
            "**EMI** stands for *Equated Monthly Installment*. It's the fixed monthly payment you make to repay a loan.\n\n"
            "Each EMI has two components:\n"
            "- **Principal** — the actual loan amount being repaid\n"
            "- **Interest** — the bank's charge for lending money\n\n"
            "In early months, most of your EMI goes toward interest. Over time, the principal portion increases."
        )

    elif any(k in message for k in ["document", "documents needed", "what do i need", "requirements"]):
        return (
            "For a typical loan application at Vertex Bank, you'll need:\n\n"
            "**Personal Documents:**\n"
            "- Government-issued Photo ID (Passport, Driver's License)\n"
            "- Proof of Address (utility bill, bank statement)\n\n"
            "**Financial Documents:**\n"
            "- 3–6 months bank statements\n"
            "- Recent pay stubs or income tax returns\n"
            "- Credit report / credit history record\n\n"
            "**Property Documents** (for mortgage loans):\n"
            "- Property deed or purchase agreement\n"
            "- Home appraisal report"
        )

    elif any(k in message for k in ["thank you", "thanks", "awesome", "great", "helpful"]):
        return (
            "You're very welcome! 😊 If you have any more questions about our AI loan evaluation, "
            "interest rates, or how to improve your eligibility — just ask! Good luck with your application!"
        )

    elif any(k in message for k in ["bye", "goodbye", "see you", "exit"]):
        return "Goodbye! Don't hesitate to return if you have more questions. Best of luck with your loan journey! 🏦"

    # Default fallback
    return (
        "I'm your Vertex Bank AI Financial Advisor. Here's what I can help with:\n\n"
        "- **'How do I apply for a loan?'**\n"
        "- **'What is my loan status?'** (requires login)\n"
        "- **'How can I improve my eligibility?'**\n"
        "- **'What are the current interest rates?'**\n"
        "- **'What is EMI?'** or **'Calculate my EMI'**\n"
        "- **'What is credit history?'**\n"
        "- **'What documents do I need?'**\n\n"
        "Try asking one of the above!"
    )
