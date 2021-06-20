from scraper.scraper import JobPageScraper
from concurrent.futures import ThreadPoolExecutor
from selenium.common.exceptions import WebDriverException

from sqlalchemy import create_engine, select, delete
from sqlalchemy.orm import Session
from scraper.models import JobOffer, JobOfferCleaned

engine = create_engine('sqlite:///./scraper/job_offers.db')
session = Session(engine)

from scraper.db_cleaning import clean_db_data

def run_scrap():
    # get list of current job IDs in the DB
    stmt = select(JobOffer.id)
    current_ids = {row.id for row in session.execute(stmt)}

    scraped_data = {}
    scraper = JobPageScraper(current_ids)

    while (scraper.last_page is not None and scraper.current_page is not None):
        job_offers = scraper.scrap_job_offers()

        with ThreadPoolExecutor(max_workers=5) as pool:
            tasks = [pool.submit(scraper.scrap_job_offer, job_id)
                        for job_id in job_offers]
            for task in tasks:
                try:
                    result = task.result()
                    job_offers[result['id']].update(result)
                except WebDriverException:
                    pass
        scraped_data.update(job_offers)

    add_jobs_to_db(scraped_data, scraper.current_ids)
    
def add_jobs_to_db(scraped_data, current_ids):
    for job_details in scraped_data.values():
        try:
            print(f"Adding {job_details['id']} to a DB.")
            job = JobOffer(**job_details)
            session.add(job)
            session.commit()
        except KeyError:
            pass
    
    for current_id in current_ids:
        session.execute(delete(JobOffer).where(JobOffer.id == current_id))
        session.commit()
    upload_cleaned_db_data()

def upload_cleaned_db_data():
    df = clean_db_data()
    job_ids = df.index

    for job_id in job_ids:
        job = JobOfferCleaned(
            id=job_id,
            **df.loc[[job_id]].to_dict('index')[job_id]
        )
        session.add(job)
        session.commit()
