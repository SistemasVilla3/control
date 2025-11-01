<script lang="ts">
	import Header from "../components/Header.svelte";
	import TableComision from "../components/TableComision.svelte";


    let nombre = "Alta de comisiones";
</script>

<main>
    <div class="min-h-screen bg-gray-50 p-6">
        <Header {nombre} />
        <TableComision/>
    </div>
</main>

<style>
</style>