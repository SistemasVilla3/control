<script lang="ts">
	import Header from "./components/Header.svelte";
	import ButtonsBar from "./components/ButtonsBar.svelte";
	import TableSeller from "./components/TableSeller.svelte";
	import ComGroup from "./components/ComGroup.svelte";
	import Carousel from "./components/Carousel.svelte";
    import '@fontsource/exo-2';
    import { onMount } from "svelte";
    import { roleName } from "$lib/functions/AuthStore";


    let nombre = "Control de vendedores";

    onMount(() => {
        let redirected = false;
        const unsubscribe = roleName.subscribe((value) => {
            if (redirected || !value) return;
            if (value !== "ADMINISTRADOR" && typeof window !== "undefined") {
                redirected = true;
                if (window.history.length > 1) {
                    window.history.back();
                } else if (document.referrer) {
                    window.location.assign(document.referrer);
                } else {
                    window.location.assign("/");
                }
            }
        });

        return () => unsubscribe();
    });
</script>

<main>
    <div class="min-h-screen bg-gray-50 p-6 space-y-6">
        <Header {nombre} />
        <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
            <!--VENDEDORES-->
            <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
                <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
                    <h1 class="text-2xl font-exo font-bold text-center text-gray-900">Vendedores</h1>
                </header>
                <div>
                    <TableSeller/>
                </div>
            </div>
            <!--PROMOCIONES-->
            <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
                <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
                    <h1 class="text-2xl font-exo font-bold text-center text-gray-900">Promociones activas</h1>
                </header>
                <div class="p-4 lg:p-6">
                    <Carousel />
                </div>
            </div>
            <!--Comisiones-->
                <div class="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
                <header class="p-2 lg:p-3 border-b border-gray-200 items-center space-x-2">
                    <h1 class="text-2xl font-exo font-bold text-center text-gray-900">Comisiones por departamento</h1>
                </header>
                <div>
                    <ComGroup/>
                </div>
            </div>
        </div>
        <ButtonsBar/>
    </div>
</main>
