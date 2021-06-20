import pandas as pd
import numpy as np
import typing


def clean_input(arg):
    type_factory = type(arg)
    return type_factory(x.lower().strip() for x in arg)

def display_offers(df, required_stack: list, optional_stack: list, min_salary: int, max_salary: int, location: list, experience: str):
    df = df.copy()

    # filter salary
    df = df[
        df.min_salary.between(min_salary, max_salary)
        | df.max_salary.between(min_salary, max_salary)
    ]

    # filter experience
    if experience:
        experience = [experience]
        experience = clean_input(experience)
        experience_index = []
        for exp in experience:
            experience_index.extend(
                df[df.seniority.str.contains(exp)].index.to_list()
            )
        df = df.loc[set(experience_index)]
    df['seniority'] = df['seniority'].str.replace(';', ', ').str.title()

    # filter location
    if location:
        location = clean_input(location)
        location_index = []
        for loc in location:
            location_index.extend(
                df[df.location.str.contains(loc)].index.to_list()
            )
        df = df.loc[set(location_index)]

    # filter stack
    required_stack = clean_input(required_stack)
    required_stack_index = set()
    for stack in required_stack:
        meets_requirement = set(
            df[df.must_have.str.contains(stack) | df.nice_have.str.contains(stack)].index.to_list()
        )
        required_stack_index = required_stack_index & meets_requirement if required_stack_index else meets_requirement
    df = df.loc[required_stack_index]

    # score stack - user input
    df['job_score'] = 0
    df['stack_in_requirements'] = pd.Series([[] for i in range(len(df))], index=df.index)
    for stack in optional_stack:
        optional_stack_index = (
            df[df.must_have.str.contains(stack) | df.nice_have.str.contains(stack)].index.to_list()
        )
        df.loc[optional_stack_index, 'job_score'] = df.loc[optional_stack_index, 'job_score'] + 1
        df.loc[optional_stack_index, 'stack_in_requirements'].apply(lambda x: x.append(stack))

    # resetting index after sorting to ensure correct order in front-end
    output = df.sort_values(
        ['job_score', 'min_salary', 'max_salary'], ascending=False).reset_index().drop(columns='index')
    return output.to_json(orient='index')
