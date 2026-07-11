from sqlalchemy.orm import Session
from typing import List, Optional
from backend.storage.models import ExperienceModel

class LessonRepository:
    @staticmethod
    def get(db: Session, experience_id: str) -> Optional[ExperienceModel]:
        return db.query(ExperienceModel).filter(ExperienceModel.experience_id == experience_id).first()

    @staticmethod
    def create(db: Session, exp_data: dict) -> ExperienceModel:
        db_exp = ExperienceModel(**exp_data)
        db.add(db_exp)
        db.commit()
        db.refresh(db_exp)
        return db_exp

    @staticmethod
    def list(db: Session) -> List[ExperienceModel]:
        return db.query(ExperienceModel).all()

    @staticmethod
    def increment_success_reuse(db: Session, experience_ids: List[str]):
        """
        Increments success reuse counter for experiences that were active during a successful trajectory.
        """
        if not experience_ids:
            return
        
        experiences = db.query(ExperienceModel).filter(
            ExperienceModel.experience_id.in_(experience_ids)
        ).all()
        
        for exp in experiences:
            exp.successful_reuse_count += 1
        db.commit()
