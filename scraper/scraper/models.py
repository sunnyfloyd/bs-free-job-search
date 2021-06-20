from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import registry

mapper_registry = registry()
Base = mapper_registry.generate_base()

class JobOffer(Base):
    __tablename__ = 'job_offer'

    id = Column(String(10), primary_key=True)
    title = Column(String)
    salary = Column(String)
    location = Column(String)
    company_name = Column(String)
    company_size = Column(String)
    recruitment_language = Column(String)
    seniority = Column(String)
    must_have = Column(String)
    nice_have = Column(String)
    url = Column(String)


class JobOfferCleaned(Base):
    __tablename__ = 'job_offer_cleaned'

    id = Column(String(10), primary_key=True)
    title = Column(String)
    seniority = Column(String)
    min_salary = Column(Integer)
    max_salary = Column(Integer)
    location = Column(String)
    company_name = Column(String)
    company_size = Column(Integer)
    recruitment_language = Column(String)
    must_have = Column(String)
    nice_have = Column(String)
    url = Column(String)
