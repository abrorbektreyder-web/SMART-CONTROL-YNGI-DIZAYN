from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.modules.expenses.models import Expense
from app.modules.expenses.schemas import ExpenseCreate, ExpenseResponse
from app.modules.shifts.models import Shift

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.post("/", response_model=ExpenseResponse)
def create_expense(expense_data: ExpenseCreate, user_id: int, db: Session = Depends(get_db)):
    # Validate Shift is Open
    shift = db.query(Shift).filter(Shift.id == expense_data.shift_id, Shift.status == "OPEN").first()
    if not shift:
        raise HTTPException(status_code=400, detail="Shift is closed or does not exist")
    
    new_expense = Expense(
        user_id=user_id,
        shift_id=expense_data.shift_id,
        amount=expense_data.amount,
        reason=expense_data.reason
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/", response_model=list[ExpenseResponse])
def get_expenses(shift_id: int, db: Session = Depends(get_db)):
    return db.query(Expense).filter(Expense.shift_id == shift_id).all()
