from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
from app.core.db import get_db
from app.core.notifications import send_telegram_alert
from app.modules.debts.models import Debt, DebtPayment, DebtStatus
from app.modules.debts.schemas import DebtCreate, DebtPaymentCreate, DebtResponse

router = APIRouter(prefix="/debts", tags=["Debts"])

# SEARCH ENDPOINT (For Frontend to find existing customers)
@router.get("/search", response_model=List[DebtResponse])
def search_debts(phone: str, db: Session = Depends(get_db)):
    # Find all debts associated with this phone number
    return db.query(Debt).filter(Debt.phone_number.contains(phone)).all()

# PAY DEBT (With Alert)
@router.post("/{id}/pay", response_model=DebtResponse)
def pay_debt(id: int, payment: DebtPaymentCreate, user_id: int, db: Session = Depends(get_db)):
    debt = db.query(Debt).filter(Debt.id == id).first()
    if not debt:
        raise HTTPException(status_code=404, detail="Debt record not found")
    
    if debt.status == DebtStatus.PAID:
        raise HTTPException(status_code=400, detail="Debt is already fully paid")
    
    # Convert payment amount to Decimal for comparison with database Decimal
    payment_amount = Decimal(str(payment.amount))
    
    if payment_amount > debt.remaining_amount:
        raise HTTPException(status_code=400, detail="Payment amount exceeds remaining debt")
    
    # Record Payment
    new_payment = DebtPayment(
        debt_id=debt.id,
        amount=payment_amount,
        user_id=user_id
    )
    db.add(new_payment)
    
    # Update Debt
    debt.remaining_amount -= payment_amount
    
    if debt.remaining_amount == 0:
        debt.status = DebtStatus.PAID
    else:
        debt.status = DebtStatus.PARTIAL
        
    db.commit()
    db.refresh(debt)
    
    # SEND TELEGRAM ALERT
    send_telegram_alert(f"💰 DEBT PAYMENT! Customer: {debt.customer_name}. Paid: {payment.amount}. Remaining: {debt.remaining_amount}")
    
    return debt

@router.get("/", response_model=list[DebtResponse])
def get_debts(status: Optional[DebtStatus] = None, db: Session = Depends(get_db)):
    query = db.query(Debt)
    if status:
        query = query.filter(Debt.status == status)
    return query.all()
