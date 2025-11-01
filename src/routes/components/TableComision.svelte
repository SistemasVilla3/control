<script lang="ts">
	import { 
        fetchComisiones,
        fetchMarcDept,
        type DeptComision,
        type Marca } from "../../lib/functions/Comisiones";
	import { onMount } from "svelte";
    import { empleado, jwtToken } from '$lib/functions/AuthStore';
	import { formatNumber } from "$lib/functions/Multitask";

    const API_ACT_COM = "http://192.168.10.134:8018/ActualizarPorcentajeComision";
    const API_ACT_MCOM = "http://192.168.10.134:8018/ActualizarComisionDeLaMarcaDelDepartamento";

    type ComisionDeptEdit = DeptComision & {nuevaComision: number};
    type ComisionMarcaEdit = Marca & { nuevaComision: number};


    let lista : ComisionDeptEdit[] = [];
    let marcasPorDept: Record<number, ComisionMarcaEdit[]> = {};
    let loading = false;
    let error = "";

    let usuarioActual: string = '';
    $: usuarioActual = $empleado ?? '';

    //Estado para el despliegue por departamento y spinners individuales
    let expandedDept: number | null = null;
    let loadingMarcas: Record<number, boolean> = {};
    let updatingDept: Record<number, boolean> = {};
    let updatingMarca: Record<string, boolean> = {};

    //Carga de comisiones por departamento
    async function loadComisiones() {
        try {
            loading = true;
            error = "";
            const raw = await fetchComisiones();
            lista = (raw as DeptComision[]).map((c) => ({
                ...c, nuevaComision: 0
            }));
            lista = lista.map(c => ({
                ...c,
                nuevaComision: 0
            }));
        } catch (e) {
            error = (e as Error).message;
        } finally {
            loading = false;
        }
    }

    //Lazy load de comisiones por marca al expandir
    async function toggleDept(dept: ComisionDeptEdit) {
        if (expandedDept === dept.IdDepartamento) {
            expandedDept = null;
            return;
        }
        expandedDept = dept.IdDepartamento;

        if (!marcasPorDept[dept.IdDepartamento]) {
            loadingMarcas[dept.IdDepartamento] = true;
            try {
                const marcas = (await fetchMarcDept(dept.IdDepartamento)) as Marca[];
                marcasPorDept[dept.IdDepartamento] = marcas.map((m) => ({
                    ...m,
                    nuevaComision: 0
                }));
            } catch (e) {
                console.error("Error cargando marcas:", e);
                marcasPorDept[dept.IdDepartamento] = [];
            } finally {
                loadingMarcas[dept.IdDepartamento] = false;
            }
        }
    }

    //Departamento: recibe el DepartamentoID
    async function updateDept(DepartamentoID: number, PorcentajeComision: number) {
        const body = {
            UsuarioModificacion: usuarioActual,
            FechaModificacion: new Date().toISOString(),
            PorcentajeComision: Number(PorcentajeComision)
        };
        const res = await fetch(`${API_ACT_COM}/${DepartamentoID}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`Error al actualizar comision de departamento. ${res.status} ${txt}`);
        }
        return res.json();
    }

    //Marca: recibe DepartamentiID + MarcaID
    async function updateMarca(DepartamentoID:number, MarcaID:number, PorcentajeComision:number) {
        const body = {
            UsuarioModificacion: usuarioActual,
            FechaModificacion: new Date().toISOString(),
            PorcentajeComision: Number(PorcentajeComision)
        };
        const res = await fetch(`${API_ACT_MCOM}?DepartamentoID=${DepartamentoID}&MarcaID=${MarcaID}`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        });
        if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(`Error al actualizar comision de marca. ${res.status} ${txt}`);
        }
        return res.json();
    }

    //Handlers que llaman las funciones ID
    async function guardarDept(dept: ComisionDeptEdit) {
        if (dept.nuevaComision == null || Number.isNaN(dept.nuevaComision)) return;
        const id = dept.IdDepartamento;
        try {
            updatingDept[id] = true;
            await updateDept(id, Number(dept.nuevaComision));
            alert(`Comision de ${dept.Nombre} actualizada correctamente`);
            dept.nuevaComision = 0;
            await loadComisiones();
        } catch (e) {
            console.error(e);
            alert("Error al actualizar la comision del departamento");
        } finally {
            updatingDept[id] = false;
        }
    }

    function marcaKey(m:ComisionMarcaEdit) {
        return `${m.DepartamentoID}-${m.MarcaID}`;
    }

    function nombreMarca(m: ComisionMarcaEdit) {
        return m.MarcasVentas?.Nombre ?? `Marca ${m.MarcaID}`;
    }

    async function guardarMarca(m: ComisionMarcaEdit) {
        if (m.nuevaComision == null || Number.isNaN(m.nuevaComision)) return;
        const key:any = marcaKey(m);
        try {
            updatingMarca[key] = true;
            await updateMarca(Number(m.DepartamentoID), Number(m.MarcaID), Number(m.nuevaComision));
            alert(`Comision de la marca ${nombreMarca(m)} actualizada correctamente`);
            m.nuevaComision =0;

            //Refrecar el panel de marcas del departamento para ver comision actualizada
            const deptId = m.DepartamentoID;
            if (deptId) {
                loadingMarcas[deptId] = true;
                try {
                    const marcas = (await fetchMarcDept(deptId)) as Marca[];
                    marcasPorDept[deptId] = marcas.map((mx) => ({
                        ...mx,
                        nuevaComision: 0
                    }));
                } finally {
                    loadingMarcas[deptId] = false;
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error al actualizar la comision de la amrca");
        } finally {
            updatingMarca[key] = false;
        }
    }

    onMount(async () => {
        jwtToken.syncFromUrl();
        usuarioActual = $empleado ?? '';
        loadComisiones();
    });
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 m-5">
    <div class="max-h-[750px] overflow-x-auto table-scroll rounded-md">
        <table class="w-full mx-auto rounded-md">
            <thead>
                <tr class="sticky top-0 z-10 bg-red-800">
                    <th class="px-6 py-3 font-exo font-black text-center text-sm text-white-900 uppercase tracking-wider">Departamento</th>
                    <th class="px-6 py-3 font-exo font-black text-center text-sm text-white-900 uppercase tracking-wider">Comision actual</th>
                    <th class="px-6 py-3 font-exo font-black text-center text-sm text-white-900 uppercase tracking-wider">Nueva comision</th>
                </tr>
            </thead>

            <tbody class="bg-white divide-y divide-gray-200">
            {#if loading}
					<tr><td colspan="3" class="px-4 py-6 text-center">Cargando comisiones...</td></tr>
				{:else if error}
					<tr><td colspan="3" class="px-4 py-6 text-center text-red-600">{error}</td></tr>
				{:else if lista.length === 0}
					<tr><td colspan="3" class="px-4 py-6 text-center">Sin datos</td></tr>
				{:else}
					{#each lista as dept}
						<!-- Fila de DEPARTAMENTO -->
						<tr class="hover:bg-gray-50 cursor-pointer" on:click={() => toggleDept(dept)}>
							<td class="py-4 px-4 font-exo font-semibold whitespace-nowrap text-gray-900 text-center">
								{dept.Nombre}
							</td>
							<td class="py-4 px-4 font-exo font-semibold text-xl whitespace-nowrap text-gray-900 text-center">
								{formatNumber(dept.PorcentajeComision)}%
							</td>
							<td class="py-3 px-4">
								<div class="flex items-center justify-center gap-3">
									<input
										class="font-exo text-gray-900 rounded-md w-28 text-center"
										type="number"
										bind:value={dept.nuevaComision}
										min="0" max="100" step="0.01"
										on:click|stopPropagation
									/>
									<button
										class="px-4 py-2 text-s rounded-md text-white-900 bg-red-800 hover:bg-red-700 disabled:opacity-50"
										disabled={updatingDept[dept.IdDepartamento]}
										on:click|stopPropagation={() => guardarDept(dept)}
									>
										{updatingDept[dept.IdDepartamento] ? "Guardando..." : "Guardar"}
									</button>
								</div>
							</td>
						</tr>

						<!-- Panel de MARCAS anidado -->
						{#if expandedDept === dept.IdDepartamento}
							<tr class="bg-gray-50">
								<td colspan="3" class="px-6 py-4">
									<!-- Contenedor de marcas limitado en alto -->
									<div class="border rounded-md bg-white">
										<div class="px-4 py-2 font-exo font-bold text-gray-900">
											Marcas de {dept.Nombre}
										</div>

										{#if loadingMarcas[dept.IdDepartamento]}
											<div class="px-4 py-6 text-center">Cargando marcas...</div>
										{:else}
											<div class="max-h-64 overflow-auto">
												<table class="min-w-full divide-y divide-gray-200">
													<thead class="bg-gray-100 sticky top-0">
														<tr>
															<th class="px-4 py-2 text-xs font-medium tracking-wider text-gray-900 uppercase text-center">
																Marca
															</th>
															<th class="px-4 py-2 text-xs font-medium tracking-wider text-gray-900 uppercase text-center">
																Comisión actual
															</th>
															<th class="px-4 py-2 text-xs font-medium tracking-wider text-gray-900 uppercase text-center">
																Nueva comisión
															</th>
														</tr>
													</thead>
													<tbody class="divide-y divide-gray-100 bg-white">
														{#each marcasPorDept[dept.IdDepartamento] as m}
															<tr class="hover:bg-gray-50">
																<td class="px-4 py-2 text-sm text-gray-700 text-center">
																	{nombreMarca(m)}
																</td>
																<td class="px-4 py-2 text-sm text-gray-700 text-center">
																	{m.PorcentajeComision != null ? `${m.PorcentajeComision}%` : "-"}
																</td>
																<td class="px-4 py-2">
																	<div class="flex items-center justify-center gap-3">
																		<input
																			class="font-exo text-gray-900 rounded-md w-28 text-center"
																			type="number"
																			bind:value={m.nuevaComision}
																			min="0" max="100" step="0.01"
																		/>
																		<button
																			class="px-4 py-2 text-s rounded-md text-white-900 bg-red-800 hover:bg-red-700 disabled:opacity-50"
																			disabled={updatingMarca[marcaKey(m)]}
																			on:click={() => guardarMarca(m)}
																		>
																			{updatingMarca[marcaKey(m)] ? "Guardando..." : "Guardar"}
																		</button>
																	</div>
																</td>
															</tr>
														{:else}
															<tr><td colspan="3" class="px-4 py-6 text-center">Sin marcas para este departamento</td></tr>
														{/each}
													</tbody>
												</table>
											</div>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				{/if}
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
  background: #800000;         /* blue-500 */
  border-radius: 4px;
  border: .5px solid #f3f4f6;   /* margen “inset” */
}
.table-scroll:hover::-webkit-scrollbar-thumb {
  background: #bd1f19;         /* blue-600 */
}
</style>