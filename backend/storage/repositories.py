from sqlalchemy.orm import Session
from typing import List, Optional
from backend.storage.models import TaskModel, ExperimentModel, AttemptModel, ExperienceModel

class TaskRepository:
    @staticmethod
    def get_task(db: Session, task_id: str) -> Optional[TaskModel]:
        return db.query(TaskModel).filter(TaskModel.task_id == task_id).first()

    @staticmethod
    def create_task(db: Session, task_data: dict) -> TaskModel:
        db_task = TaskModel(**task_data)
        db.add(db_task)
        db.commit()
        db.refresh(db_task)
        return db_task

    @staticmethod
    def list_tasks(db: Session) -> List[TaskModel]:
        return db.query(TaskModel).all()

class ExperimentRepository:
    @staticmethod
    def get_experiment(db: Session, experiment_id: str) -> Optional[ExperimentModel]:
        return db.query(ExperimentModel).filter(ExperimentModel.experiment_id == experiment_id).first()

    @staticmethod
    def create_experiment(db: Session, exp_data: dict) -> ExperimentModel:
        db_exp = ExperimentModel(**exp_data)
        db.add(db_exp)
        db.commit()
        db.refresh(db_exp)
        return db_exp

    @staticmethod
    def list_experiments(db: Session) -> List[ExperimentModel]:
        return db.query(ExperimentModel).all()

    @staticmethod
    def add_attempt(db: Session, attempt_data: dict) -> AttemptModel:
        db_attempt = AttemptModel(**attempt_data)
        db.add(db_attempt)
        db.commit()
        db.refresh(db_attempt)
        return db_attempt

class ExperienceRepository:
    @staticmethod
    def get_experience(db: Session, experience_id: str) -> Optional[ExperienceModel]:
        return db.query(ExperienceModel).filter(ExperienceModel.experience_id == experience_id).first()

    @staticmethod
    def create_experience(db: Session, exp_data: dict) -> ExperienceModel:
        db_exp = ExperienceModel(**exp_data)
        db.add(db_exp)
        db.commit()
        db.refresh(db_exp)
        return db_exp

    @staticmethod
    def list_experiences(db: Session) -> List[ExperienceModel]:
        return db.query(ExperienceModel).all()

    @staticmethod
    def query_by_tags(db: Session, tags: List[str]) -> List[ExperienceModel]:
        # For simplicity, we can fetch all and check tag overlaps
        # SQLite JSON contains allows querying JSON arrays but check overlap is safer in Python.
        all_experiences = db.query(ExperienceModel).all()
        if not tags:
            return all_experiences
        
        matched = []
        tags_set = set(tags)
        for exp in all_experiences:
            exp_tags = exp.tags or []
            if tags_set.intersection(exp_tags):
                matched.append(exp)
        return matched
