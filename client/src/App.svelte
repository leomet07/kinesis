<!-- App.svelte -->
<script>
	import { Router, Link, Route } from "svelte-routing";
	import Home from "./routes/Home.svelte";
	import About from "./routes/About.svelte";
	import Login from "./routes/Login.svelte";
	import { validauthtoken, uid, whole_user } from "./store";
	import { onMount } from "svelte";
	import Navbar from "./components/Navbar.svelte";
	import Register from "./routes/Register.svelte";

	export let url = "";

	window.BASE_URL = "https://kinesisbackend.herokuapp.com";
	window.dev = false;
	if (
		window.location.hostname == "localhost" ||
		window.location.hostname == "127.0.0.1"
	) {
		window.dev = true;
		window.BASE_URL = "http://127.0.0.1:4444";
	}
	console.log(window.BASE_URL);
	console.log("window.dev: ", window.dev);

	onMount(async () => {
		const auth_token = localStorage.getItem("auth-token");
		if (auth_token) {
			console.log("cached auth token", auth_token);
			const r = await fetch(
				window.BASE_URL +
					"/api/auth/verify/" +
					encodeURIComponent(auth_token),
				{
					method: "GET",
				}
			);
			const rjson = await r.json();

			if (rjson.valid) {
				$uid = String(rjson.uid);
				$validauthtoken = auth_token;
				$whole_user = rjson.user;
				console.log("Whole user: ", $whole_user);
				console.log("Login saved!!", rjson.uid);
			}
		}
	});
</script>

<Router {url}>
	<Navbar />
	<meta name="robots" content="noindex, nofollow" />

	<div id="render">
		<Route path="about" component={About} />
		<Route path="register" component={Register} />
		<Route path="login" component={Login} />
		<Route path="/"><Home /></Route>
	</div>
</Router>

<style>
	#render {
		width: 100%;
		min-height: 90vh;
		margin: 0px;
		padding: 0px;
	}
</style>
