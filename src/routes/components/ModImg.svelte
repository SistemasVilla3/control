<script lang="ts">
	import { fetchNoticia, fetchNoticias, type Noticia } from "$lib/functions/Noticias";
	import { onMount } from "svelte";
    import { empleado, jwtToken } from '$lib/functions/AuthStore';

    const UPD_NEW = 'http://192.168.10.134:8018/noticiasActualizar'

    let noticias: Noticia[] = [];
    let nombre: string;
    let desc: string;
    let fecha: string | null;
    let user: string = "admin"; // Usuario de creación, puede ser dinámico si se implementa autenticación
    let state: 'true' | 'false' = 'true';
    let selectedNew = 0;

    $: activo = state === 'true';
    $: user = $empleado ?? '';

    $: if (selectedNew) {
        names();
    }

    async function names() {
        const newId = Number(selectedNew);

        try {
            const data = await fetchNoticia(newId);
            nombre = data?.Titulo ?? null;
            desc = data?.Descripcion ?? null;
            fecha = data?.FechaPublicacion
                ? new Date(data.FechaPublicacion)
                .toISOString()
                .split("T")[0]
                : null;
            user = data?.UsuarioCreacion ?? "admin"; // Asignar usuario de creación
            state = data?.Activo != null
            ? String(data.Activo) as 'true' | 'false'
            : 'true';
        } catch (error) {
            console.error("Error fetching noticia:", error);
            nombre = "Error al cargar la noticia";
        }
    }

    async function UpdateNew(title: string, description: string, date: string, user: string, status: boolean) {
        const bodyData = {
            Titulo: title,
            Descripcion: description,
            FechaPublicacion: date,
            UsuarioCreacion: user,
            Activo: status
        };

        try {
            const response = await fetch(`${UPD_NEW}/${selectedNew}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
            console.log("Datos", bodyData);

            if (!response.ok) {
                const text = await response.text();
                console.error('PATCH fail:', text);
                throw new Error("Error al actualizar la noticia");
            }

            const result = await response.json();
            console.log("Noticia actualizada:", result);
        } catch (error) {
            console.error("Error al actualizar la noticia:", error);
        }
        
    }

    async function handleUpdate() {
        if (!selectedNew || !desc || !fecha) {
            alert("Por favor, completa todos los campos.");
            return;
        }

        const fechaISO = new Date(fecha).toISOString();

        try {
            await UpdateNew(nombre!, desc, fechaISO, user, activo);
            alert('Noticia actualizada correctamente.');

            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('No se pudo actualizar la noticia. Revisa la consola para más detalles.');
        }
    }

    onMount (async ()=> { 
        noticias = await (fetchNoticias());
        jwtToken.syncFromUrl();
        user = $empleado ?? '';
        });
</script>

<div class="bg-white">
    <div>
        <form>
            <label class="font-exo text-center text-lg text-black-900">
                Título:<br>
                <select 
                class="font-exo rounded-md"
                bind:value={selectedNew}>
                <option value="" disabled selected>Seleccionar una noticia</option>
                {#each noticias as n}
                    <option value={n.Id}>{n.Titulo}</option>
                {/each}
                </select>
            </label>
            <label class="font-exo text-center text-lg text-black-900">
                Nuevo Título(opcional):<br>
                <input 
                class="font-exo rounded-md border border-gray-800"
                type="text" 
                bind:value={nombre} required />
            </label>
            <label class="font-exo text-center text-lg text-black-900">
                Descripción:<br>
                <textarea 
                class="rounded-md"
                bind:value={desc} required></textarea>
            </label>
            <label class="font-exo text-center text-lg text-black-900">
                Fecha de Publicación:<br>
                <input 
                class="rounded-md"
                type="date" 
                bind:value={fecha} required />
            </label>
            <label class="font-exo text-center text-lg text-black-900">
                Usuario de Creación:<br>
                <input 
                class="rounded-md"
                type="text" 
                bind:value={user} readonly />
            </label>
            <label class="font-exo text-center text-lg text-black-900">
                Estado: <br>
                <select 
                class="rounded-md"
                bind:value={state}>
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                </select>
            </label>
            <button type="submit" on:click={handleUpdate}>
                Actualizar
            </button>
        </form>
    </div>
</div>

<style>
  form {
        display: flex;
        flex-direction: column;
    }
</style>