from scraper import engine
import pandas as pd
# import numpy as np


### CLEANING FUCTIONS ###
# using a factory to skip pandas pipe which would make code
# unnecessarily verbose
def extract_salary(extract_type):
    i = 0 if extract_type == 'min' else 1    
    def inner(df):
        return (df['salary']
            .str.extract(pat=r'([\d\ ]+)(?:\ -\ )?([\d\ ]+)')[i]
            .str.replace(' ', '')
            .where(lambda x: x != '', 0)
            .astype('int32'))
    return inner

def extract_company_size(df):
    df_ = ( df
            .company_size
            .str.extract(pat=r'((?:\d-)(\d+))|(\d+)'))
    df['company_size'] = df_[2].where(~df_[2].isnull(), df_[1]).astype('int32')
    return df

def clean_location(df):
    trans_table = str.maketrans('ąćęłńóśźż', 'acelnoszz')
    rename_location = { 'krakow': 'cracow',
                        'warszawa': 'warsaw',
                        'zdalna': 'remote'}

    return (df
            .location
            .str.lower()
            .str.translate(trans_table)
            .str.extract(r'([A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)', expand=False)
            .replace(rename_location))

### CLEANING EXECUTION ###
def clean_db_data():
    columns_order = ['title', 'seniority', 'min_salary', 'max_salary','location', 'company_name', 'company_size', 'recruitment_language', 'must_have', 'nice_have', 'url']
    return (
        pd.read_sql('job_offer', engine)
        .set_index('id')
        .assign(min_salary=extract_salary('min'), max_salary=extract_salary('max'))
        .assign(max_salary=lambda x: x.max_salary.where(x.max_salary != 0, x.min_salary))
        .drop(columns='salary')
        .pipe(extract_company_size)
        .assign(location=lambda x: clean_location(x))
        .assign(recruitment_language=lambda x: x.recruitment_language.str.replace(', ', ';'))
        .assign(seniority=lambda x: x.seniority.str.lower())
        .assign(must_have=lambda x: x.must_have.str.lower(), nice_have=lambda x: x.nice_have.str.lower())
    )[columns_order]
