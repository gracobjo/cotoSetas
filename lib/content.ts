/** Datos estáticos de tarifas, especies, enlaces y contenido del coto */

export const SITE = {
  name: "Villardeciervos Micología",
  title:
    "Villardeciervos Micología | Sierra de la Culebra – Permisos y Partes Micocyl",
  description:
    "Información oficial sobre recolección de setas en Villardeciervos (Sierra de la Culebra, Zamora). Permisos PMZA-50.001, tarifas Micocyl, especies, rutas y parte micológico.",
  url: "https://villardeciervos-micologia.vercel.app",
  parkCode: "PMZA-50.001",
  parkName: "Parque Micológico Montes del Noroeste Zamorano",
  location: "Villardeciervos, Sierra de la Culebra, Zamora",
  coordinates: { lat: 41.94, lng: -6.28 },
} as const;

export const LINKS = {
  micocyl: "https://www.micocyl.es/",
  micodata: "https://www.micocyl.es/",
  appPlay:
    "https://play.google.com/store/apps/details?id=es.jcyl.ita.sacyl.micocyl",
  adisac: "https://micologia.adisaclavoz.com/rutas/Villardeciervos.html",
  pinares: "https://www.pinaresdeurbion.es/",
  whatsapp: "https://wa.me/34644386025?text=Hola%2C%20consulta%20sobre%20permisos%20micológicos%20en%20Villardeciervos",
} as const;

export type Especie = {
  id: string;
  nombre: string;
  cientifico: string;
  descripcion: string;
  epoca: string;
  imagen: string;
};

export const ESPECIES: Especie[] = [
  {
    id: "boletus",
    nombre: "Boletus",
    cientifico: "Boletus edulis y B. pinicola",
    descripcion:
      "Reyes de la zona, muy abundantes a mediados y finales de otoño en pinares y zonas mixtas de la Sierra de la Culebra.",
    epoca: "Mediados–finales de otoño",
    imagen: "/especies/boletus-edulis.jpg",
  },
  {
    id: "niscalo",
    nombre: "Níscalos",
    cientifico: "Lactarius deliciosus",
    descripcion:
      "Muy frecuentes en las faldas de la Sierra de la Culebra cubiertas de pino. Clásicos de la micología zamorana.",
    epoca: "Otoño (sept–nov)",
    imagen: "/especies/niscalo.jpg",
  },
  {
    id: "cucurril",
    nombre: "Cucurriles / Macrolepiotas",
    cientifico: "Macrolepiota procera",
    descripcion:
      "Fáciles de ver en los claros del bosque y zonas de matorral. Requieren identificación cuidadosa.",
    epoca: "Finales de verano–otoño",
    imagen: "/especies/cucurril.jpg",
  },
  {
    id: "chantarela",
    nombre: "Chantarelas y llanegas",
    cientifico: "Cantharellus y Hygrophorus",
    descripcion:
      "Escondidas en las zonas más húmedas y umbrías. Recompensan al recolector paciente y respetuoso.",
    epoca: "Otoño húmedo",
    imagen: "/especies/chantarela.jpg",
  },
];

export const BUENAS_PRACTICAS = [
  {
    titulo: "Permiso y DNI",
    texto:
      "Es 100% obligatorio llevar el permiso correspondiente (digital o impreso) y el DNI durante la actividad.",
    icon: "BadgeCheck",
  },
  {
    titulo: "Cesta de mimbre",
    texto:
      "Usar obligatoriamente cesta de mimbre o recipientes que permitan la aireación y caída de esporas. Las bolsas de plástico están totalmente prohibidas.",
    icon: "ShoppingBasket",
  },
  {
    titulo: "Sin rastrillos",
    texto:
      "Prohibido remover el suelo con rastrillos u hoces: destruye el micelio y pone en riesgo futuras fructificaciones.",
    icon: "Ban",
  },
  {
    titulo: "Corte limpio",
    texto:
      "Cortar la seta por la base del pie con navaja micológica o extraerla volteándola con cuidado.",
    icon: "Scissors",
  },
  {
    titulo: "Límite de capturas",
    texto:
      "El permiso recreativo estándar autoriza un máximo de 5 kg de setas por persona y día.",
    icon: "Scale",
  },
  {
    titulo: "Plataforma oficial",
    texto:
      "Los pases oficiales se tramitan también en Micocyl. Esta web emite comprobantes digitales verificables para el coto local.",
    icon: "Globe",
  },
] as const;

export const PARTE_ACTUAL = {
  fechaBadge: "Actualizado a finales de agosto 2026",
  estado: "Baja o nula fructificación",
  resumen:
    "El verano mantiene el terreno seco y con altas temperaturas. La producción actual de especies comerciales (Boletus edulis, Lactarius deliciosus) es prácticamente inexistente.",
  prediccion:
    "La emisión de los nuevos partes e informes predictivos se reactivará de forma semanal a partir de la segunda quincena de septiembre y principios de octubre.",
  // Fecha aproximada del inicio de la 2ª quincena de septiembre 2026
  countdownTarget: "2026-09-15T00:00:00+02:00",
} as const;
