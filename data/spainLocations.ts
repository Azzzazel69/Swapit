
export interface Municipality {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface Province {
  id: string;
  name: string;
  lat: number;
  lng: number;
  municipalities: Municipality[];
}

export interface Community {
  id: string;
  name: string;
  provinces: Province[];
}

// Coordenadas aproximadas y lista extendida de municipios principales de España
export const SPAIN_LOCATIONS: Community[] = [
  {
    id: "01",
    name: "Andalucía",
    provinces: [
      { id: "04", name: "Almería", lat: 36.834, lng: -2.463, municipalities: [{ id: "04013", name: "Almería" }, { id: "04032", name: "El Ejido" }, { id: "04079", name: "Roquetas de Mar" }, { id: "04066", name: "Níjar" }] },
      { id: "11", name: "Cádiz", lat: 36.526, lng: -6.283, municipalities: [{ id: "11012", name: "Cádiz" }, { id: "11020", name: "Jerez de la Frontera" }, { id: "11004", name: "Algeciras" }, { id: "11031", name: "San Fernando" }, { id: "11015", name: "Chiclana de la Frontera" }, { id: "11027", name: "El Puerto de Santa María" }] },
      { id: "14", name: "Córdoba", lat: 37.888, lng: -4.772, municipalities: [{ id: "14021", name: "Córdoba" }, { id: "14040", name: "Lucena" }, { id: "14056", name: "Puente Genil" }] },
      { id: "18", name: "Granada", lat: 37.177, lng: -3.598, municipalities: [{ id: "18087", name: "Granada" }, { id: "18140", name: "Motril" }, { id: "18003", name: "Almuñécar" }, { id: "18021", name: "Baza" }] },
      { id: "21", name: "Huelva", lat: 37.261, lng: -6.944, municipalities: [{ id: "21041", name: "Huelva" }, { id: "21043", name: "Lepe" }, { id: "21002", name: "Almonte" }] },
      { id: "23", name: "Jaén", lat: 37.779, lng: -3.784, municipalities: [{ id: "23050", name: "Jaén" }, { id: "23055", name: "Linares" }, { id: "23005", name: "Andújar" }, { id: "23092", name: "Úbeda" }] },
      { id: "29", name: "Málaga", lat: 36.721, lng: -4.421, municipalities: [{ id: "29067", name: "Málaga" }, { id: "29070", name: "Marbella" }, { id: "29094", name: "Torremolinos" }, { id: "29054", name: "Estepona" }, { id: "29015", name: "Benalmádena" }, { id: "29054", name: "Fuengirola" }, { id: "29092", name: "Vélez-Málaga" }] },
      { id: "41", name: "Sevilla", lat: 37.389, lng: -5.984, municipalities: [{ id: "41091", name: "Sevilla" }, { id: "41038", name: "Dos Hermanas" }, { id: "41004", name: "Alcalá de Guadaíra" }, { id: "41095", name: "Utrera" }, { id: "41065", name: "Mairena del Aljarafe" }, { id: "41039", name: "Écija" }] }
    ]
  },
  {
    id: "02",
    name: "Aragón",
    provinces: [
      { id: "22", name: "Huesca", lat: 42.136, lng: -0.408, municipalities: [{ id: "22125", name: "Huesca" }, { id: "22048", name: "Barbastro" }, { id: "22158", name: "Monzón" }] },
      { id: "44", name: "Teruel", lat: 40.345, lng: -1.106, municipalities: [{ id: "44216", name: "Teruel" }, { id: "44013", name: "Alcañiz" }] },
      { id: "50", name: "Zaragoza", lat: 41.648, lng: -0.889, municipalities: [{ id: "50297", name: "Zaragoza" }, { id: "50067", name: "Calatayud" }, { id: "50272", name: "Utebo" }] }
    ]
  },
  {
    id: "03",
    name: "Asturias",
    provinces: [
      { id: "33", name: "Asturias", lat: 43.361, lng: -5.849, municipalities: [{ id: "33044", name: "Oviedo" }, { id: "33024", name: "Gijón" }, { id: "33004", name: "Avilés" }, { id: "33034", name: "Langreo" }, { id: "33037", name: "Mieres" }, { id: "33066", name: "Siero" }] }
    ]
  },
  {
    id: "04",
    name: "Baleares",
    provinces: [
      { id: "07", name: "Baleares", lat: 39.569, lng: 2.650, municipalities: [{ id: "07040", name: "Palma" }, { id: "07026", name: "Ibiza" }, { id: "07032", name: "Mahón" }, { id: "07011", name: "Calvià" }, { id: "07033", name: "Manacor" }] }
    ]
  },
  {
    id: "05",
    name: "Canarias",
    provinces: [
      { id: "35", name: "Las Palmas", lat: 28.123, lng: -15.436, municipalities: [{ id: "35016", name: "Las Palmas de Gran Canaria" }, { id: "35026", name: "Telde" }, { id: "35019", name: "Santa Lucía de Tirajana" }, { id: "35004", name: "Arrecife" }] },
      { id: "38", name: "Santa Cruz de Tenerife", lat: 28.463, lng: -16.251, municipalities: [{ id: "38038", name: "Santa Cruz de Tenerife" }, { id: "38023", name: "San Cristóbal de La Laguna" }, { id: "38006", name: "Arona" }, { id: "38001", name: "Adeje" }] }
    ]
  },
  {
    id: "06",
    name: "Cantabria",
    provinces: [
      { id: "39", name: "Cantabria", lat: 43.462, lng: -3.805, municipalities: [{ id: "39075", name: "Santander" }, { id: "39087", name: "Torrelavega" }, { id: "39016", name: "Castro-Urdiales" }, { id: "39012", name: "Camargo" }] }
    ]
  },
  {
    id: "07",
    name: "Castilla y León",
    provinces: [
      { id: "05", name: "Ávila", lat: 40.656, lng: -4.700, municipalities: [{ id: "05019", name: "Ávila" }] },
      { id: "09", name: "Burgos", lat: 42.343, lng: -3.696, municipalities: [{ id: "09059", name: "Burgos" }, { id: "09219", name: "Miranda de Ebro" }, { id: "09018", name: "Aranda de Duero" }] },
      { id: "24", name: "León", lat: 42.598, lng: -5.567, municipalities: [{ id: "24089", name: "León" }, { id: "24115", name: "Ponferrada" }, { id: "24142", name: "San Andrés del Rabanedo" }] },
      { id: "34", name: "Palencia", lat: 42.009, lng: -4.524, municipalities: [{ id: "34120", name: "Palencia" }] },
      { id: "37", name: "Salamanca", lat: 40.970, lng: -5.663, municipalities: [{ id: "37274", name: "Salamanca" }] },
      { id: "40", name: "Segovia", lat: 40.942, lng: -4.108, municipalities: [{ id: "40194", name: "Segovia" }] },
      { id: "42", name: "Soria", lat: 41.766, lng: -2.464, municipalities: [{ id: "42173", name: "Soria" }] },
      { id: "47", name: "Valladolid", lat: 41.652, lng: -4.724, municipalities: [{ id: "47186", name: "Valladolid" }, { id: "47010", name: "Arroyo de la Encomienda" }] },
      { id: "49", name: "Zamora", lat: 41.503, lng: -5.744, municipalities: [{ id: "49275", name: "Zamora" }] }
    ]
  },
  {
    id: "08",
    name: "Castilla-La Mancha",
    provinces: [
      { id: "02", name: "Albacete", lat: 38.994, lng: -1.858, municipalities: [{ id: "02003", name: "Albacete" }, { id: "02037", name: "Hellín" }] },
      { id: "13", name: "Ciudad Real", lat: 38.984, lng: -3.927, municipalities: [{ id: "13034", name: "Ciudad Real" }, { id: "13071", name: "Puertollano" }, { id: "13082", name: "Tomelloso" }, { id: "13005", name: "Alcázar de San Juan" }] },
      { id: "16", name: "Cuenca", lat: 40.070, lng: -2.137, municipalities: [{ id: "16078", name: "Cuenca" }] },
      { id: "19", name: "Guadalajara", lat: 40.632, lng: -3.164, municipalities: [{ id: "19130", name: "Guadalajara" }, { id: "19044", name: "Azuqueca de Henares" }] },
      { id: "45", name: "Toledo", lat: 39.862, lng: -4.027, municipalities: [{ id: "45168", name: "Toledo" }, { id: "45165", name: "Talavera de la Reina" }, { id: "45081", name: "Illescas" }] }
    ]
  },
  {
    id: "09",
    name: "Cataluña",
    provinces: [
      { id: "08", name: "Barcelona", lat: 41.385, lng: 2.173, municipalities: [{ id: "08019", name: "Barcelona" }, { id: "08015", name: "Badalona" }, { id: "08101", name: "L'Hospitalet de Llobregat" }, { id: "08279", name: "Terrassa" }, { id: "08187", name: "Sabadell" }, { id: "08121", name: "Mataró" }, { id: "08245", name: "Santa Coloma de Gramenet" }, { id: "08211", name: "Sant Cugat del Vallès" }, { id: "08073", name: "Cornellà de Llobregat" }] },
      { id: "17", name: "Girona", lat: 41.979, lng: 2.821, municipalities: [{ id: "17079", name: "Girona" }, { id: "17066", name: "Figueres" }, { id: "17032", name: "Blanes" }] },
      { id: "25", name: "Lleida", lat: 41.617, lng: 0.620, municipalities: [{ id: "25120", name: "Lleida" }] },
      { id: "43", name: "Tarragona", lat: 41.118, lng: 1.244, municipalities: [{ id: "43148", name: "Tarragona" }, { id: "43123", name: "Reus" }, { id: "43171", name: "Vila-seca" }, { id: "43037", name: "Cambrils" }] }
    ]
  },
  {
    id: "10",
    name: "Comunidad Valenciana",
    provinces: [
      { id: "03", name: "Alicante", lat: 38.345, lng: -0.481, municipalities: [{ id: "03014", name: "Alicante" }, { id: "03065", name: "Elche" }, { id: "03133", name: "Torrevieja" }, { id: "03099", name: "Orihuela" }, { id: "03031", name: "Benidorm" }, { id: "03009", name: "Alcoy" }, { id: "03063", name: "Elda" }] },
      { id: "12", name: "Castellón", lat: 39.986, lng: -0.051, municipalities: [{ id: "12040", name: "Castellón de la Plana" }, { id: "12135", name: "Vila-real" }] },
      { id: "46", name: "Valencia", lat: 39.469, lng: -0.376, municipalities: [{ id: "46250", name: "Valencia" }, { id: "46244", name: "Torrent" }, { id: "46131", name: "Gandia" }, { id: "46190", name: "Paterna" }, { id: "46220", name: "Sagunto" }, { id: "46022", name: "Alzira" }] }
    ]
  },
  {
    id: "11",
    name: "Extremadura",
    provinces: [
      { id: "06", name: "Badajoz", lat: 38.879, lng: -6.970, municipalities: [{ id: "06015", name: "Badajoz" }, { id: "06083", name: "Mérida" }, { id: "06044", name: "Don Benito" }, { id: "06153", name: "Villanueva de la Serena" }, { id: "06001", name: "Almendralejo" }] },
      { id: "10", name: "Cáceres", lat: 39.475, lng: -6.372, municipalities: [{ id: "10037", name: "Cáceres" }, { id: "10148", name: "Plasencia" }] }
    ]
  },
  {
    id: "12",
    name: "Galicia",
    provinces: [
      { id: "15", name: "A Coruña", lat: 43.362, lng: -8.411, municipalities: [{ id: "15030", name: "A Coruña" }, { id: "15078", name: "Santiago de Compostela" }, { id: "15036", name: "Ferrol" }, { id: "15054", name: "Narón" }, { id: "15059", name: "Oleiros" }] },
      { id: "27", name: "Lugo", lat: 43.012, lng: -7.557, municipalities: [{ id: "27028", name: "Lugo" }] },
      { id: "32", name: "Ourense", lat: 42.335, lng: -7.863, municipalities: [{ id: "32054", name: "Ourense" }] },
      { id: "36", name: "Pontevedra", lat: 42.433, lng: -8.644, municipalities: [{ id: "36057", name: "Vigo" }, { id: "36038", name: "Pontevedra" }, { id: "36059", name: "Vilagarcía de Arousa" }] }
    ]
  },
  {
    id: "13",
    name: "Comunidad de Madrid",
    provinces: [
      { 
        id: "28", 
        name: "Madrid", 
        lat: 40.416, 
        lng: -3.703,
        municipalities: [
          { id: "28079", name: "Madrid" }, 
          { id: "28092", name: "Móstoles" }, 
          { id: "28005", name: "Alcalá de Henares" }, 
          { id: "28058", name: "Fuenlabrada" }, 
          { id: "28074", name: "Leganés" }, 
          { id: "28065", name: "Getafe" }, 
          { id: "28006", name: "Alcobendas" }, 
          { id: "28106", name: "Parla" }, 
          { id: "28148", name: "Torrejón de Ardoz" }, 
          { id: "28007", name: "Alcorcón" }, 
          { id: "28123", name: "Rivas-Vaciamadrid" }, 
          { id: "28080", name: "Majadahonda" }, 
          { id: "28115", name: "Pozuelo de Alarcón" }, 
          { id: "28171", name: "Valdemoro" }
        ] 
      }
    ]
  },
  {
    id: "14",
    name: "Región de Murcia",
    provinces: [
      { id: "30", name: "Murcia", lat: 37.992, lng: -1.130, municipalities: [{ id: "30030", name: "Murcia" }, { id: "30016", name: "Cartagena" }, { id: "30024", name: "Lorca" }, { id: "30027", name: "Molina de Segura" }, { id: "30005", name: "Alcantarilla" }, { id: "30041", name: "Torre-Pacheco" }, { id: "30001", name: "Abanilla" }] }
    ]
  },
  {
    id: "15",
    name: "Navarra",
    provinces: [
      { id: "31", name: "Navarra", lat: 42.812, lng: -1.645, municipalities: [{ id: "31201", name: "Pamplona" }, { id: "31232", name: "Tudela" }, { id: "31058", name: "Barañáin" }] }
    ]
  },
  {
    id: "16",
    name: "País Vasco",
    provinces: [
      { id: "01", name: "Álava", lat: 42.846, lng: -2.672, municipalities: [{ id: "01059", name: "Vitoria-Gasteiz" }] },
      { id: "48", name: "Vizcaya", lat: 43.263, lng: -2.935, municipalities: [{ id: "48020", name: "Bilbao" }, { id: "48013", name: "Barakaldo" }, { id: "48044", name: "Getxo" }, { id: "48079", name: "Portugalete" }, { id: "48082", name: "Santurtzi" }] },
      { id: "20", name: "Guipúzcoa", lat: 43.318, lng: -1.981, municipalities: [{ id: "20069", name: "San Sebastián" }, { id: "20045", name: "Irún" }, { id: "20030", name: "Eibar" }] }
    ]
  },
  {
    id: "17",
    name: "La Rioja",
    provinces: [
      { id: "26", name: "La Rioja", lat: 42.462, lng: -2.445, municipalities: [{ id: "26089", name: "Logroño" }, { id: "26036", name: "Calahorra" }] }
    ]
  },
  {
    id: "18",
    name: "Ceuta",
    provinces: [
      { id: "51", name: "Ceuta", lat: 35.889, lng: -5.319, municipalities: [{ id: "51001", name: "Ceuta" }] }
    ]
  },
  {
    id: "19",
    name: "Melilla",
    provinces: [
      { id: "52", name: "Melilla", lat: 35.292, lng: -2.938, municipalities: [{ id: "52001", name: "Melilla" }] }
    ]
  }
];

// Helper to get a flat list for search: "Municipio (Provincia)"
export const FLAT_MUNICIPALITIES = SPAIN_LOCATIONS.flatMap(comm => 
    comm.provinces.flatMap(prov => 
        prov.municipalities.map(muni => ({
            label: `${muni.name} (${prov.name})`,
            id: muni.id,
            muniName: muni.name,
            provName: prov.name,
            commName: comm.name,
            lat: prov.lat, // Fallback coordinates
            lng: prov.lng
        }))
    )
);
