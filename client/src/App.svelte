<script>
	import DoubleRangeSlider from "./DoubleRangeSlider.svelte";
	let start = 0;
	let end = 1;

	function formatNumber(num) {
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
	}

	function normalizeSalary(num, sep) {
		if (!num && num !== 0) return "";
		num = Math.round(num.toFixed(2) * 40000);
		if (sep) {
			num = formatNumber(num);
		}
		return num;
	}

	import { writable } from "svelte/store";
	export const jobCriteria = writable({
		required_stack: [],
		optional_stack: [],
		min_salary: null,
		max_salary: null,
		location: [],
		experience: "",
	});

	let required_stack;
	let optional_stack;
	let location;

	function addCriterion(stackType, storeObject, inputID) {
		if (stackType != null && stackType !== "" && !storeObject.includes(stackType)) {
			let stack = storeObject;
			stack.push(stackType);
			storeObject = stack;
			$jobCriteria.experience = $jobCriteria.experience;
			document.getElementById(inputID).value = "";
			stackType = '';
		}
	}

	function removeCriterion(crit, storeObject) {
		let arr = storeObject;
		const index = arr.indexOf(crit);
		arr.splice(index, 1);
		storeObject = arr;
		$jobCriteria.experience = $jobCriteria.experience;
	}

	function handleKeyPress(e, stackType, storeObject, inputID) {
		if (e.charCode === 13) addCriterion(stackType, storeObject, inputID);
	}

	let jobs = [];
	let jobsFetched = false;

	async function fetchJobs() {
		$jobCriteria.min_salary = normalizeSalary(start);
		$jobCriteria.max_salary = normalizeSalary(end);

		let jobFetchParams = new URLSearchParams($jobCriteria).toString();
		let jobFetchURL = new URL('/jobs?' + jobFetchParams, window.location.href);
		const res = await fetch(jobFetchURL, {method: "GET"});
		const json = await res.json();
		jobs = Object.values(json);
		jobsFetched = true;
	}
</script>

<div class="container">
	<img class="mx-auto d-block responsive" src="logo.png" alt="bs-free logo">
	<h4>Search for your perfect job:</h4>
	<label for="inputMustHave" class="form-label mb-0 mt-1">Required stack:</label>
	<div class="d-flex mb-0">
		<input
			type="text"
			class="form-control"
			id="inputMustHave"
			placeholder="Stack that MUST be in a job offer (click ENTER to add)"
			bind:value={required_stack}
			on:keypress={handleKeyPress(event, required_stack, $jobCriteria.required_stack, 'inputMustHave')}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addCriterion(required_stack, $jobCriteria.required_stack, 'inputMustHave')}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.required_stack as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterion(tag, $jobCriteria.required_stack)}">{tag}</span>
		{/each}
	</div>
	
	<label for="inputNiceHave" class="form-label mb-0 mt-1">Optional stack:</label>
	<div class="d-flex mb-0">
		<input
			type="text"
			class="form-control"
			id="inputNiceHave"
			placeholder="Stack that CAN be in a job offer (click ENTER to add)"
			bind:value={optional_stack}
			on:keypress={handleKeyPress(event, optional_stack, $jobCriteria.optional_stack, 'inputNiceHave')}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addCriterion(optional_stack, $jobCriteria.optional_stack, 'inputNiceHave')}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.optional_stack as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterion(tag, $jobCriteria.optional_stack)}">{tag}</span>
		{/each}
	</div>

	<label for="location" class="form-label form-label mb-0 mt-1">Location:</label>
	<div class="d-flex mb-0">
		<input
			type="text"
			class="form-control"
			id="location"
			placeholder="City or 'remote' (click ENTER to add)"
			bind:value={location}
			on:keypress={handleKeyPress(event, location, $jobCriteria.location, 'location')}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addCriterion(location, $jobCriteria.location, 'location')}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.location as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterion(tag, $jobCriteria.location)}">{tag}</span>
		{/each}
	</div>

	<div class="row">
		<div class="col-6">
			<label for="seniority" class="form-label form-label mb-0 mt-1">Experience level:</label>
			<select
				id="seniority"
				class="form-select mb-0"
				aria-label="seniority select"
				bind:value={$jobCriteria.experience}
			>
				<option selected value="">All</option>
				<option value="Trainee">Trainee</option>
				<option value="Junior">Junior</option>
				<option value="Mid">Mid</option>
				<option value="Senior">Senior</option>
				<option value="Expert">Expert</option>
			</select>
		</div>
		<div class="col-6 align-items-end">
			<label for="salary" class="form-label form-label mb-0 mt-1">Salary:</label>
			<DoubleRangeSlider bind:start bind:end />
			<div>
				{normalizeSalary(start, true)} PLN - {normalizeSalary(end, true)} PLN
			</div>
		</div>
	</div>

	<div class="d-grid">
		<button class="btn btn-primary" on:click={fetchJobs}>Find Matching Job Offers</button>
	</div>

	{#if jobs.length > 0}
	<h4>Jobs found:</h4>
	<div>
		{#each jobs as job}
		<a href="{job["url"]}" target="_blank">
		<div class="job-offer py-2 ps-4 mb-2">
			<div class="row pt-2">
				<div class="col-6 align-items-center p-0">
					<h5 class="mb-0">{job['title']}</h5>
				</div>
				<div class="col-6 d-flex justify-content-end align-items-center p-0 pe-4">
					<div class="salary">{formatNumber(job["min_salary"])} - {formatNumber(job["max_salary"])} PLN</div>	
				</div>
			</div>
			<div class="row pt-1 job-tags">
				<div class="col-6 p-0">
					<div class="d-inline pe-2"><i class="bi bi-geo-alt pe-1"></i>{job["location"]}</div>
					<div class="d-inline pe-2"><i class="bi bi-building pe-1"></i>{job["company_name"]}</div>
					<div class="d-inline"><i class="bi bi-person-circle pe-1"></i>{job["seniority"]}</div>
				</div>
				<div class="col-6 p-0">
					<div class="d-flex justify-content-end pe-4">
						{#each job["stack_in_requirements"] as stack}
						<span class="badge rounded-pill bg-secondary mx-1">{stack}</span>
						{/each}
					</div>
				</div>
			</div>
		</div>
		</a>
		{/each}
	</div>
	{:else if jobsFetched}
		<h4 class="text-center">No jobs have been found :(</h4>
	{/if}
</div><br><br>
