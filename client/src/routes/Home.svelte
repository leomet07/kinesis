<script>
	import { validauthtoken, circles_data, uid, owned_point } from "../store";
	import { onMount } from "svelte";

	let current_circle_index = 0;
	// let owned_point = {};
	const radius = 25;
	onMount(async () => {
		const search_str = window.location.search;
		console.log("Early check", localStorage.getItem("update_param"));
		const paras = new URLSearchParams(search_str);
		const update_param =
			paras.get("update") || localStorage.getItem("update_param");
		localStorage.setItem("update_param", update_param); // even if falsy value
		validauthtoken.subscribe(async (v) => {
			let canvas = document.querySelector("#map");
			if (v) {
				await get_current_occupication();
				canvas.style.display = "block";
				await init_canvas();

				const existing = $circles_data.findIndex(
					(v) => v._id == update_param
				);
				if (existing > -1) {
					console.log("made it");
					if ($circles_data[existing].current_occupied_user_id) {
						console.log("Circle is occupied, was it me?");
						if (
							$circles_data[existing].current_occupied_user_id ==
							$uid
						) {
							current_circle_index = existing;
							await unoccupy();
							localStorage.setItem("update_param", "");
						}
					} else {
						console.log("Circle is not occupied");
						current_circle_index = existing;
						await occupy();
						localStorage.setItem("update_param", "");
					}
				}
			} else {
				canvas.style.display = "none";
			}
		});
	});

	async function get_current_occupication() {
		const body = { current_occupied_user_id: $uid };
		const r = await fetch(window.BASE_URL + "/api/db/get_points", {
			method: "POST",
			headers: {
				"auth-token": $validauthtoken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});
		const rjson = await r.json();
		console.log(rjson);
		if (rjson.points?.length > 0) {
			console.log("Has a registered point");
			$owned_point = rjson.points[0];
		}
	}

	async function init_canvas() {
		let canvas = document.querySelector("#map");
		if (!canvas) {
			return;
		}
		let heightRatio = 0.5;
		canvas.height = canvas.width * heightRatio;
		console.log("Init height : ", canvas.height, canvas.width);
		let ctx = canvas.getContext("2d");

		let img = new Image();
		img.src = "/img/floorplan.jpg";

		img.onload = function () {
			ctx.drawImage(img, 0, 0);
		};

		let circles = [];
		// let circles_data = [
		// 	{ x: 0, y: 0, occupied: true },
		// 	{ x: 1000, y: 500, occupied: false },
		// ];
		// let circles_data = [];
		const r = await fetch(window.BASE_URL + "/api/db/get_points", {
			method: "GET",
			headers: {
				"auth-token": $validauthtoken,
			},
		});

		const rjson = (await r.json()).points;
		$circles_data = rjson;

		circles_data.subscribe((new_circles_data) => {
			// ctx.clearRect(0, 0, canvas.width, canvas.height);
			new_circles_data.forEach((p) => {
				let circle = new Path2D();

				circle.arc(p.x, p.y - radius / 2, radius, 0, 2 * Math.PI);
				circles.push(circle);
				ctx.beginPath();
				let modal = document.getElementById("modal");
				if (p.current_occupied_user_id) {
					ctx.fillStyle = "#FF2929";
					// modal.style.backgroundColor = "#FF2929";
				} else {
					ctx.fillStyle = "#87D03A";
					// modal.style.backgroundColor = "#87D03A";
				}
				ctx.fill(circle);
				ctx.stroke();
			});
		});
		canvas.addEventListener(
			"click",
			function (event) {
				let rect = canvas.getBoundingClientRect();
				let x = event.pageX - rect.left;
				let y = event.pageY - rect.top;
				let wasClicked = false;
				for (let i = 0; i < $circles_data.length; i++) {
					const cmath = $circles_data[i];

					if (
						checkIfinCircle(
							x,
							y,
							cmath.x,
							cmath.y - radius / 2,
							radius,
							rect
						)
					) {
						console.log("clicked on circle number ", i);
						current_circle_index = i;
						let modal = document.getElementById("modal");
						const wratio = 2000 / rect.width;
						const hratio = 1000 / rect.height;
						modal.style.top = rect.top + cmath.y / wratio + "px";
						modal.style.left =
							rect.left +
							cmath.x / hratio +
							radius * 2 +
							50 +
							"px";
						open_modal();
						wasClicked = true;
						break;
					}
				}
				if (!wasClicked) {
					close_modal();
				}
			},

			false
		);
	}

	function checkIfinCircle(x, y, cx, cy, r, rect) {
		const wratio = 2000 / rect.width;
		const hratio = 1000 / rect.height;

		x = x * wratio;
		y = y * hratio;
		const xdiff = Math.abs(x - cx);
		const ydiff = Math.abs(y - cy);
		return Math.sqrt(Math.pow(xdiff, 2) + Math.pow(ydiff, 2)) <= r;
	}
	async function occupy() {
		console.log("Occupy");
		const point = $circles_data[current_circle_index];
		console.log(point);
		const newpoint = await occupy_request(point._id);
		$circles_data[current_circle_index] = newpoint;
		$circles_data = $circles_data;
		$owned_point = newpoint;
		close_modal();
	}
	async function occupy_request(point_id) {
		const r = await fetch(window.BASE_URL + "/api/db/occupy_point", {
			method: "POST",
			headers: {
				"auth-token": $validauthtoken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ point_id: point_id }),
		});
		const rjson = await r.json();
		if (rjson.success) {
			const newpoint = rjson.updated;
			return newpoint;
		} else {
			return null;
		}
	}
	async function unoccupy() {
		console.log("Unoccupy");
		const point = $circles_data[current_circle_index];
		const r = await fetch(window.BASE_URL + "/api/db/unoccupy_point", {
			method: "POST",
			headers: {
				"auth-token": $validauthtoken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ point_id: point._id }),
		});
		const rjson = await r.json();
		if (rjson.success) {
			const newpoint = rjson.updated;
			$circles_data[current_circle_index] = newpoint;
			$circles_data = $circles_data;
			console.log(rjson.stay);
		}
		$owned_point = {};
		close_modal();
	}

	async function leaveCurrent() {
		current_circle_index = $circles_data.findIndex(
			(v) => v._id == $owned_point._id
		);

		await unoccupy();
		close_modal();
	}

	function close_modal() {
		let modal = document.getElementById("modal");
		modal.style.display = "none";
	}
	function open_modal() {
		let modal = document.getElementById("modal");
		modal.style.display = "block";
	}

	async function reportCovid() {
		const r = await fetch(window.BASE_URL + "/api/db/change_covid_status", {
			method: "POST",
			headers: {
				"auth-token": $validauthtoken,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ covid_status: true }),
		});

		const rjson = await r.json();
		if (rjson.updated_user) {
			console.log("Covid Reported");
		}
	}
</script>

<main id="home">
	<!-- <h2 class="title">Home</h2> -->
	{#if $validauthtoken}
		<div>
			<h2 style="color:green">Logged in!</h2>
			<button id="report_covid" on:click={reportCovid}
				>Report Covid</button
			>
			{#if Object.keys($owned_point).length !== 0}
				<div class="seat_info">
					<h2>
						You are currently occupying a seat in the resturant!
					</h2>
					<h2>
						Occupied since: {new Date(
							$owned_point.occupied_since
						).toLocaleString()}
					</h2>
					<button id="leave_current" on:click={leaveCurrent}
						>Leave current point</button
					>
				</div>
			{:else}
				<div class="seat_info">
					<h2>
						You are not currently occupying a seat! Feel free to
						book one!
					</h2>
				</div>
			{/if}
		</div>
	{:else}
		<h2 class="block">
			<span style="color:red">Not logged in!</span>
		</h2>
		<h3>
			Since you aren't logged in, you won't be able to register where
			you're located or report your covid status!.
		</h3>
		<h3>So, what's the point of using Kinesis without an account?</h3>
	{/if}

	<canvas id="map" width="2000px" height="1000px" />
	<div
		id="modal"
		style={`background-color: ${
			$owned_point?._id ? "#FF2929" : "#87D03A"
		}; color: ${$owned_point?._id ? "#fff" : "#000"};`}
	>
		<div class="modal-content">
			{#if $circles_data}
				{#if $circles_data[current_circle_index]?.current_occupied_user_id}
					<p>Occupied</p>
					{#if $circles_data[current_circle_index]?._id == $owned_point._id || Object.keys($owned_point).length == 0}
						<button class="small_button" on:click={unoccupy}
							>Leave</button
						>
					{/if}
				{:else}
					<p>Open</p>
					{#if $circles_data[current_circle_index]?._id == $owned_point._id || Object.keys($owned_point).length == 0}
						<button class="small_button" on:click={occupy}
							>Occupy</button
						>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
</main>

<style>
	#home {
		text-align: center;
	}
	#map {
		margin: none;
		border: 1px solid black;
		width: 100%;
		max-width: 1500px;
		margin: auto;
	}
	.block {
		display: inline;
	}
	#modal {
		position: absolute;
		/*top: 100px;
		left: ;*/
		display: none;
		transform: translate(-50%, -50%);
		width: 150px;
		padding: 10px;
		border-radius: 5px;
		border: 1px solid black;
	}

	#modal p {
		word-break: break-all;
		white-space: normal;
		font-weight: bold;
	}

	#leave_current {
		font-size: 16px;
		padding: 5px;
		border: 1px solid black;
		border-radius: 5px;
		margin-top: 5px;
		margin-bottom: 5px;
		background-color: rgb(255, 228, 228);
	}

	#modal .small_button {
		font-size: 14px;
		padding: 5px;
		border: 1px solid black;
		border-radius: 5px;
		background-color: white;
		margin-top: 3px;
	}

	.seat_info {
		margin-bottom: 5px;
	}

	#report_covid {
		background-color: rgb(255, 246, 198);
		color: black;
		border: 1px solid black;
		border-radius: 5px;
		padding: 5px;
		margin-top: 5px;
		margin-bottom: 2px;
	}
</style>
