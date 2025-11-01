const API_VED_ID = "http://192.168.10.134:8018/vendedoresID/";
const API_VED_ALL = "http://192.168.10.134:8018/vendedores";

export type Vendedor = {
    IdVendedor: number;
    Nombre: string;
    Activo: boolean;
    RHID: number;
    SapID: number;
    SucursalID: number
}

export type Vendedores = Vendedor[];

export async function fetchVend(id: string) {
    const res = await fetch(`${API_VED_ID}${id}`);
    if(!res.ok) {
        const body = await res.text();
        console.error(`Backend respondio ${res.statusText}`, body);
        throw new Error('Error al cargar los vendedores');
    }
    const data = await res.json();
    return data;
}

export async function fetchVendedores() {
    const res = await fetch(API_VED_ALL);
    if(!res.ok) {
        const body = await res.text();
        console.error(`Backend respondio ${res.statusText}`, body);
        throw new Error('Error al cargar los vendedores');
    }
    const data = await res.json();
    return data;
}