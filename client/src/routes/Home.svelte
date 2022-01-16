<script>
	import { validauthtoken, circles_data, uid } from "../store";
	import { onMount } from "svelte";
	import { Link } from "svelte-routing";

	let current_circle_index = 0;
	let owned_point = {};

	onMount(async () => {
		validauthtoken.subscribe(async (v) => {
			if (v) {
				await get_current_occupication();
				init_canvas();
			}
		});
	});

	async function get_current_occupication() {
		const body = { current_occupied_user_id: $uid };
		const r = await fetch("http://127.0.0.1:4444/api/db/get_points", {
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
			owned_point = rjson.points[0];
		}
	}

	async function init_canvas() {
		let canvas = document.querySelector("#bigimg");
		if (!canvas) {
			return;
		}
		let heightRatio = 0.5;
		canvas.height = canvas.width * heightRatio;
		console.log("Init height : ", canvas.height, canvas.width);
		let ctx = canvas.getContext("2d");
		const radius = 50;
		let img = new Image();
		img.src = "/img/background.png";
		ctx.drawImage(img, 0, 0);

		let circles = [];
		// let circles_data = [
		// 	{ x: 0, y: 0, occupied: true },
		// 	{ x: 1000, y: 500, occupied: false },
		// ];
		// let circles_data = [];
		const r = await fetch("http://127.0.0.1:4444/api/db/get_points", {
			method: "GET",
			headers: {
				"auth-token": $validauthtoken,
			},
		});

		const rjson = (await r.json()).points;
		$circles_data = rjson;

		circles_data.subscribe((new_circles_data) => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			new_circles_data.forEach((p) => {
				let circle = new Path2D();

				circle.arc(p.x, p.y - radius / 2, radius, 0, 2 * Math.PI);
				circles.push(circle);
				ctx.beginPath();
				let modal = document.getElementById("modal");
				if (p.current_occupied_user_id) {
					ctx.fillStyle = "red";
					modal.style.backgroundColor = "red";
				} else {
					ctx.fillStyle = "green";
					modal.style.backgroundColor = "green";
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
							50,
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
							10 +
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
		const r = await fetch("http://127.0.0.1:4444/api/db/occupy_point", {
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
			owned_point = newpoint;
		}
		close_modal();
	}
	async function unoccupy() {
		console.log("Unoccupy");
		const point = $circles_data[current_circle_index];
		const r = await fetch("http://127.0.0.1:4444/api/db/unoccupy_point", {
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
		owned_point = {};
		close_modal();
	}

	async function leaveCurrent() {
		current_circle_index = $circles_data.findIndex(
			(v) => v._id == owned_point._id
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
</script>

<main>
	<h1>Home</h1>
	{#if $validauthtoken}
		<div class="block">
			You are: <p style="color:green">logged in!</p>
		</div>
	{:else}
		<div class="block">
			You are: <p style="color:red">not logged in!</p>
		</div>
		<p>
			Since you are not logged in, you won't be able to register where
			you've been.
		</p>
		<Link to="/login">login</Link>
	{/if}

	{#if Object.keys(owned_point).length !== 0}
		<div>
			<h2>Your occupied point: {owned_point._id}</h2>
			<h2>
				Occupied since: {new Date(
					owned_point.occupied_since
				).toUTCString()}
			</h2>
			<button on:click={leaveCurrent}>Leave current point</button>
		</div>
	{/if}

	<canvas id="bigimg" width="2000px" height="1000px" />
	<div id="modal">
		<div class="modal-content">
			{#if $circles_data}
				{#if $circles_data[current_circle_index]?.current_occupied_user_id}
					<p>Occupied</p>
					<button on:click={unoccupy}>Leave</button>
				{:else}
					<p>Open</p>
					<button on:click={occupy}>Occupy</button>
				{/if}
			{/if}
		</div>
	</div>
</main>

<style>
	#bigimg {
		margin: none;
		border: 1px solid black;
		width: 100%;
	}
	.block {
		display: inline;
	}
	#modal {
		color: white;
		position: absolute;
		/*top: 100px;
		left: ;*/
		display: none;
		transform: translate(-50%, -50%);
		width: 150px;
		background-color: red;
		padding: 10px;
		border-radius: 5px;
	}

	#modal p {
		word-break: break-all;
		white-space: normal;
	}
</style>
