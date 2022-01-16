<script>
	import { Link } from "svelte-routing";
	import { validauthtoken, circles_data, uid, owned_point } from "../store";

	async function signout() {
		localStorage.setItem("auth-token", "");
		$validauthtoken = "";
		$circles_data = [];
		$uid = "";
		$owned_point = {};
	}
</script>

<nav id="navbar">
	<div class="link">
		<Link to="about">About</Link>
	</div>
	<Link class="link" to="/"
		><img id="logo" src="/img/logo.png" alt="Kinesis Logo" /></Link
	>

	{#if $validauthtoken}
		<span class="link" on:click={signout}>Sign out</span>
	{:else}
		<div class="link">
			<Link to="login">Login</Link>
		</div>
	{/if}
</nav>

<style>
	#navbar {
		width: 100%;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: space-around;
		padding-left: 20vw;
		padding-right: 20vw;
	}
	#logo {
		height: 25px;
	}
	#navbar .link {
		text-decoration: underline;
		cursor: pointer;
		width: 200px;
	}
	@media only screen and (max-width: 600px) {
		#navbar {
			justify-content: space-between;
			padding-left: 5vw;
			padding-right: 5vw;
		}
		#logo {
			margin-left: 10px;
		}
	}
</style>
