const API_NEW_GET = "http://192.168.10.134:8018/noticiasRecientes";
const API_NEW_ID = "http://192.168.10.134:8018/traerNoticia";

export type Noticia = {
    Id: number;
    Titulo: string;
    Descripcion: string;
    FechaPub: string;
    imagen?: string;
    ImagenBase64?: string;
}

export type Noticias = Noticia[];

 export type NoticiaEdit ={
    Id: number;
    Titulo: string;
    Descripcion: string;
    UsuarioCreacion: string;
    FechaPublicacion: string;
    Activo: 'Activa' | 'Inactiva';
}

export async function fetchNoticias() {
    try {
        const res = await fetch(API_NEW_GET);
        if (!res.ok) {
            const body = await res.text();
            console.error(`Backend respondio ${res.statusText}`, body);
            throw new Error('Error al cargar las noticias');
        }
        const data = await res.json() as Noticias;
        return data;
    } catch (error) {
        console.error("Error al obtener las noticias:", error);
        throw new Error('Error al cargar las noticias');
    }
}

export async function fetchNoticia(id: number) {
    try {
        const res = await fetch(`${API_NEW_ID}/${id}`);
        if (!res.ok) {
            const body = await res.text();
            console.error(`Backend respondio ${res.statusText}`, body);
            throw new Error('Error al cargar la noticia');
        }
        const data = await res.json() as NoticiaEdit;
        return data;
    } catch (error) {
        console.error("Error al obtener la noticia:", error);
        throw new Error('Error al cargar la noticia');
    }
}