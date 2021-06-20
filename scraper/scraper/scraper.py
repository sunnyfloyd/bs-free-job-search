from selenium import webdriver
from selenium.common.exceptions import WebDriverException
from retry import retry

class JobPageScraper:
    gecko_driver = r'C:\Users\mdebs\Documents\WebDrivers\geckodriver.exe'
    options = webdriver.FirefoxOptions()
    options.add_argument('--headless')
    # base_url = 'https://nofluffjobs.com/jobs/frontend?criteria=seniority%3Djunior'
    # base_url = 'https://nofluffjobs.com/jobs/frontend?criteria=seniority%3Djunior%20django'
    # base_url = 'https://nofluffjobs.com/jobs/python?criteria=salary%3Cpln49900m'
    base_url = 'https://nofluffjobs.com/jobs?criteria=salary<pln50000m'
    # base_url = 'https://nofluffjobs.com/jobs/frontend?criteria=category%3Dtesting%20seniority%3Dexpert%20salary%3Epln30600m'
    job_url = 'https://nofluffjobs.com/job/'

    def __init__(self, current_ids):
        self.current_page = 1
        self.last_page = self.find_last_page()
        self.current_ids = current_ids
    
    def scrap_job_page(self, url, exception_message):
        driver = webdriver.Firefox( executable_path=self.gecko_driver, options=self.options)
        try:
            driver.get(url)
            return driver
        except WebDriverException:
            driver.quit()
            print(exception_message)
            raise WebDriverException

    @retry(exceptions=WebDriverException)
    def find_last_page(self):
        driver = self.scrap_job_page(   f'{self.base_url}&page={self.current_page}',
                                        'Could not load first page.')
        pages = driver.find_elements_by_css_selector('a.page-link')
        if pages:
            output = int(pages[-2].text)
        else:
            try:
                driver.find_element_by_css_selector('h2.text-white.font-weight-bold').text
                output = None
            except:
                output = 1
        
        driver.quit()
        return output

    @retry(exceptions=WebDriverException)
    def scrap_job_offers(self):
        print(f'Scraping page {self.current_page}')
        driver = self.scrap_job_page(   f'{self.base_url}&page={self.current_page}',
                                        f'Could not load page {self.current_page}.')
        
        offers = driver.find_elements_by_css_selector('a.posting-list-item')
        job_offers = {}
        for offer in offers:
            job_id = offer.get_attribute('id')[-8:]
            if job_id in self.current_ids:
                print(f'{job_id} already in a database!')
                self.current_ids = self.current_ids - {job_id}
                continue
            title = (   offer
                        .find_element_by_css_selector('h2.posting-title__position')
                        .text)
            salary = offer.find_element_by_css_selector('.salary').text
            location = (offer
                        .find_element_by_css_selector('span.posting-info__location')
                        .text)
            job_url = f'{self.job_url}{job_id}'
            offer_info = {
                'title': title,
                'salary': salary,
                'location': location,
                'url': job_url
            }
            job_offers[job_id] = offer_info

        self.current_page = self.current_page + 1 if self.current_page < self.last_page else None
        
        driver.quit()
        return job_offers

    @retry(exceptions=WebDriverException, tries=3, delay=1, jitter=1)
    def scrap_job_offer(self, job_id):
        print(f'Scraping {job_id}')
        driver = self.scrap_job_page(   f'{self.job_url}{job_id}',
                                        f'Could not load job details for {job_id}')

        job_details = {'id': job_id}

        basic_fields = ('company_name', 'company_size', 'recruitment_language')
        basic_values = driver.find_elements_by_css_selector('.dl-horizontal.align-items-center.mb-0.d-flex')[:3]
        for field, value in zip(basic_fields, basic_values):
            if any(x in value.text for x in ['Company', 'Recruitment language']):
                job_details[field] = value.text.split('\n')[1]

        seniority = driver.find_elements_by_css_selector('.star-section.active')
        job_details['seniority'] = ';'.join(x.text for x in seniority)

        must_have = driver.find_elements_by_css_selector('#posting-requirements a')
        must_have.extend(driver.find_elements_by_css_selector('#posting-requirements button'))
        job_details['must_have'] = ';'.join(x.text for x in must_have)

        nice_have = driver.find_elements_by_css_selector('#posting-nice-to-have a')
        nice_have.extend(driver.find_elements_by_css_selector('#posting-nice-to-have button'))
        job_details['nice_have'] = ';'.join(x.text for x in nice_have)

        driver.quit()
        print(f'Scraping completed for {job_id}')
        return job_details
