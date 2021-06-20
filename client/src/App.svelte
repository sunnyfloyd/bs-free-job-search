<script>
	import DoubleRangeSlider from "./DoubleRangeSlider.svelte";
	let start = 0;
	let end = 1;
	const nice = (d) => {
		if (!d && d !== 0) return "";
		return d.toFixed(2);
	};

	function formatNumber(num) {
		return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
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

	function addRequiredStack() {
		if (required_stack != null && required_stack !== "" && !$jobCriteria.required_stack.includes(required_stack)) {
			let stack = $jobCriteria.required_stack
			stack.push(required_stack);
			$jobCriteria.required_stack = stack;
			document.getElementById('inputMustHave').value = "";
			required_stack = '';
		}
	}
	function addOptionalStack() {
		if (optional_stack != null && optional_stack !== "" && !$jobCriteria.optional_stack.includes(optional_stack)) {
			let stack = $jobCriteria.optional_stack
			stack.push(optional_stack);
			$jobCriteria.optional_stack = stack;
			document.getElementById('inputNiceHave').value = "";
			optional_stack = '';
		}
	}
	function addLocation() {
		if (location != null && location !== "" && !$jobCriteria.location.includes(location)) {
			let stack = $jobCriteria.location
			stack.push(location);
			$jobCriteria.location = stack;
			document.getElementById('location').value = ""
			location = '';
		}
	}
	function removeCriterionRequired(crit) {
		let arr = $jobCriteria.required_stack;
		const index = arr.indexOf(crit);
		arr.splice(index, 1);
		$jobCriteria.required_stack = arr;
	}
	function removeCriterionOptional(crit) {
		let arr = $jobCriteria.optional_stack;
		const index = arr.indexOf(crit);
		arr.splice(index, 1);
		$jobCriteria.optional_stack = arr;
	}
	function removeCriterionLocation(crit) {
		let arr = $jobCriteria.location;
		const index = arr.indexOf(crit);
		arr.splice(index, 1);
		$jobCriteria.location = arr;
	}

	const onKeyPressRequired = e => {
    	if (e.charCode === 13) addRequiredStack();
  	};
	const onKeyPressOptional = e => {
    	if (e.charCode === 13) addOptionalStack();
  	};
	const onKeyPressLocation = e => {
    	if (e.charCode === 13) addLocation();
  	};

	let jobs;

	async function fetchJobs() {
		$jobCriteria.min_salary = Math.round(nice(start) * 40000);
		$jobCriteria.max_salary = Math.round(nice(end) * 40000);
		const res = await fetch("/jobs", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify($jobCriteria),
		});
		const json = await res.json();
		jobs = Object.values(json)
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
			on:keypress={onKeyPressRequired}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addRequiredStack}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.required_stack as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterionRequired(tag)}">{tag}</span>
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
			on:keypress={onKeyPressOptional}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addOptionalStack}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.optional_stack as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterionOptional(tag)}">{tag}</span>
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
			on:keypress={onKeyPressLocation}
		/>
		<div class="d-inline-flex p-2">
			<button type="button" class="btn btn-outline-primary btn-sm" on:click={addLocation}>+</button>
		</div>
	</div>
	<div>
		{#each $jobCriteria.location as tag}
		<span class="badge bg-primary mx-1" on:click="{removeCriterionLocation(tag)}">{tag}</span>
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
				{formatNumber(Math.round(nice(start) * 40000))} PLN - {formatNumber(Math.round(nice(end) * 40000))} PLN
			</div>
		</div>
	</div>

	<div class="d-grid">
		<button class="btn btn-primary" on:click={fetchJobs}>Find Matching Job Offers</button>
	</div>

	{#if jobs}
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
		<!-- <h4 class="text-center">No jobs have been found :(</h4> -->
	{/if}
</div><br><br>
