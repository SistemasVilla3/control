<script lang="ts">
    import { fetchComisiones, type Comisiones } from "$lib/functions/Comisiones";
	import { formatNumber } from "$lib/functions/Multitask";
	import { onMount } from "svelte";


    let lista : Comisiones;
    let loading = false;
    let error = "";

    async function loadComisiones() {
        try {
            loading = true;
            error = "";
            lista = await fetchComisiones();
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    }

    onMount(async () => {
        loadComisiones();
    });
</script>

<div class="space-y-2">
    <div class="max-h-[600px] table-scroll overflow-y-auto">
        <table class="w-full border-collapse">
        <thead>
            <tr class="border-b border-gray-200 text-gray-900 text-sm">
                <th class="py-2 px-4 font-exo font-black text-xl text-left">Departamento</th>
                <th class="py-2 px-4 font-exo font-black text-xl text-right">% Comisión</th>
            </tr>
        </thead>

        <tbody>
            {#each lista as com}
            <tr>
                <td class="py-2 px-4 font-exo text-lg text-left font-semibold text-gray-900">{com.Nombre}</td>
                <td class="py-3 px-4 font-exo text-lg text-right">
                    <span class="inline-flex font-exo text-lg items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {formatNumber(com.PorcentajeComision)}%
                    </span>
                </td>
            </tr>
           {/each}
        </tbody>
    </table>
    </div>
</div>

<style>
    .table-scroll::-webkit-scrollbar {
  width: 8px;                  /* grosor */
}
.table-scroll::-webkit-scrollbar-track {
  background: #f3f4f6;         /* gray-100 */
  border-radius: 4px;
}
.table-scroll::-webkit-scrollbar-thumb {
  background: #3b82f6;         /* blue-500 */
  border-radius: 4px;
  border: .5px solid #f3f4f6;   /* margen “inset” */
}
.table-scroll:hover::-webkit-scrollbar-thumb {
  background: #2563eb;         /* blue-600 */
}
</style>