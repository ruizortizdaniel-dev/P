export interface RailwayTerm {
  term: string;
  letter: string;
  category: 
    | 'Vía e Infraestructura'
    | 'Electrificación y Catenaria'
    | 'Señalización y Bloqueo'
    | 'Seguridad y Protección'
    | 'Operaciones y Tráfico'
    | 'Comunicaciones y Telemática';
  definition: string;
  securityContext?: string;
  sourceUrl?: string;
  relatedTerms?: string[];
}

export const ADIF_RAILWAY_DICTIONARY: RailwayTerm[] = [
  // ==========================================
  // --- A ---
  // ==========================================
  {
    term: 'Aguja',
    letter: 'A',
    category: 'Vía e Infraestructura',
    definition: 'Parte móvil del desvío ferroviario que, al acoplarse o separarse de la contraaguja, permite desviar o mantener la circulación de los trenes hacia una vía directa o desviada. Consta de punta (acople), zona intermedia y talón (fija).',
    securityContext: 'Punto crítico de sabotaje o avería. Los vigilantes de patrulla deben inspeccionar que no haya piedras, calces u objetos extraños atrapados entre la aguja y la contraaguja que impidan su acoplamiento.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#a',
    relatedTerms: ['Desvío', 'Contraaguja', 'Espadín', 'Enclavamiento', 'Talonamiento']
  },
  {
    term: 'Ancho de vía',
    letter: 'A',
    category: 'Vía e Infraestructura',
    definition: 'Distancia entre las caras activas de las cabezas de los dos carriles, medida a 14 mm por debajo del plano de rodadura. En España conviven el ancho ibérico (1.668 mm), el ancho estándar o internacional UIC (1.435 mm, en líneas de alta velocidad) y el métrico (1.000 mm).',
    securityContext: 'Define el tipo de material rodante y las instalaciones en los cambiadores de ancho.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#a',
    relatedTerms: ['Carril', 'Cambiador de ancho', 'Traviesa']
  },
  {
    term: 'Aparato de vía',
    letter: 'A',
    category: 'Vía e Infraestructura',
    definition: 'Instalación fija de la superestructura de vía que permite la bifurcación, cruce o enlace de dos o más vías férreas. Incluye desvíos, escapes, travesías y cruzamientos.',
    securityContext: 'Las instalaciones de aparatos de vía disponen de motores eléctricos y cerrojos de comprobación de posición integrados en el enclavamiento. Su manipulación no autorizada constituye un delito grave contra la seguridad ferroviaria.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#a',
    relatedTerms: ['Aguja', 'Desvío', 'Enclavamiento']
  },
  {
    term: 'Apeadero',
    letter: 'A',
    category: 'Operaciones y Tráfico',
    definition: 'Instalación ferroviaria abierta al público para la subida y bajada de viajeros que no dispone de agujas ni personal de circulación propio, dependiendo administrativamente de una estación colindante.',
    securityContext: 'Zonas frecuentes de vandalismo, grafitis e intrusiones al carecer de presencia continuada de personal ferroviario. Vigilancia perimetral prioritaria.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#a',
    relatedTerms: ['Estación', 'Andén', 'Cerramiento']
  },
  {
    term: 'ASFA (Anuncio de Señales y Frenado Automático)',
    letter: 'A',
    category: 'Seguridad y Protección',
    definition: 'Sistema de protección de trenes que transmite información inductiva desde balizas situadas en la vía hasta la cabina de conducción. Repite la indicación de las señales y supervisa la velocidad, provocando el frenado de emergencia si el maquinista no reconoce un aviso o rebasa una señal en parada.',
    securityContext: 'Las balizas ASFA están ancladas en el balasto entre los carriles. Ante cualquier impacto o manipulación sospechosa debe notificarse inmediatamente al Puesto de Mando (PM).',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#a',
    relatedTerms: ['Baliza', 'Señal de parada', 'Puesto de Mando', 'ERTMS']
  },

  // ==========================================
  // --- B ---
  // ==========================================
  {
    term: 'Balasto',
    letter: 'B',
    category: 'Vía e Infraestructura',
    definition: 'Capa granular de piedra dura triturada (generalmente pórfido, granito o caliza silícea) de tamaño específico tendida sobre la plataforma para soportar, drenar y asentar las traviesas y los carriles, absorbiendo las vibraciones del tráfico.',
    securityContext: 'Prohibido el tránsito de personas no autorizadas sobre el balasto (riesgo de caídas, atrapamiento y arrollamiento). Caminar siempre por los paseos laterales provistos de chaleco de alta visibilidad homologado ADIF.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#b',
    relatedTerms: ['Traviesa', 'Banqueta de balasto', 'Explanación']
  },
  {
    term: 'Baliza',
    letter: 'B',
    category: 'Señalización y Bloqueo',
    definition: 'Dispositivo electromagnético o transpondedor fijado a la traviesa entre los carriles que transmite datos de seguridad a las antenas captadoras del tren al pasar sobre ella (sistemas ASFA o ERTMS).',
    securityContext: 'Componente de alta seguridad de ADIF. Prohibido manipular, desconectar o depositar herramientas sobre las balizas durante las rondas de vigilancia.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#b',
    relatedTerms: ['ASFA', 'ERTMS', 'Señal luminosa']
  },
  {
    term: 'Banalización (Vía Banalizada)',
    letter: 'B',
    category: 'Operaciones y Tráfico',
    definition: 'Disposición técnica de una línea de vía doble dotada de señalización y bloqueo bidireccional en ambas vías, permitiendo que los trenes circulen indistintamente en cualquiera de los dos sentidos por ambas vías con plenas garantías de seguridad.',
    securityContext: 'En vías banalizadas nunca se debe asumir la dirección de llegada de un tren por el sentido habitual de la marcha; los trenes pueden aproximarse por cualquier vía en cualquier dirección.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#b',
    relatedTerms: ['Bloqueo Ferroviario', 'Vía doble', 'Itinerario']
  },
  {
    term: 'Bloqueo Ferroviario',
    letter: 'B',
    category: 'Señalización y Bloqueo',
    definition: 'Sistema reglamentario y técnico que impide que dos trenes coincidan simultáneamente en el mismo cantón de vía. Puede ser Bloqueo Automático (BA/BAB/BAD), Bloqueo de Liberación Automática (BLA) o Bloqueo Telefónico (BT).',
    securityContext: 'Fundamento elemental de la seguridad del tráfico. Su vulneración por causas técnicas o corte de cables provoca la caída automática de las señales a rojo (parada).',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#b',
    relatedTerms: ['Cantón', 'Circuito de vía', 'Puesto de Mando']
  },
  {
    term: 'Bogie',
    letter: 'B',
    category: 'Operaciones y Tráfico',
    definition: 'Estructura rodante pivotante situada bajo el chasis de los vehículos ferroviarios, equipada con ruedas, ejes, suspensión y elementos de frenado, que facilita la inscripción del vehículo en las curvas.',
    securityContext: 'Zona crítica del material rodante donde los intrusos o grafiteros intentan ocultarse en vías de estacionamiento.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#b',
    relatedTerms: ['Material rodante', 'Eje', 'Freno']
  },

  // ==========================================
  // --- C ---
  // ==========================================
  {
    term: 'Calce de descarrilamiento (o Calce de vía)',
    letter: 'C',
    category: 'Seguridad y Protección',
    definition: 'Dispositivo mecánico fijado sobre un carril que se abate sobre la cabeza del mismo para provocar el desvío o detención forzada de vehículos que escapen por gravedad en vías de maniobras o carga, evitando que invadan las vías generales.',
    securityContext: 'Protección de vías secundarias respecto a vías generales. No retirar sin autorización expresa del responsable de circulación.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Topera', 'Vía de escape', 'Mango de vía']
  },
  {
    term: 'Cantón de bloqueo',
    letter: 'C',
    category: 'Señalización y Bloqueo',
    definition: 'Tramo de vía de longitud determinada en el que no puede haber más de un tren circulando al mismo tiempo al estar protegido por las señales de bloqueo.',
    securityContext: 'La ocupación indebida de un cantón por personas, vehículos ajenos o maquinaria sin corte de vía provoca incidencias graves de seguridad y detención de la circulación.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Bloqueo Ferroviario', 'Circuito de vía', 'Señal luminosa']
  },
  {
    term: 'Carril (o Riel)',
    letter: 'C',
    category: 'Vía e Infraestructura',
    definition: 'Perfil de acero laminado compuesto por cabeza, alma y patín, colocado sobre las traviesas en dos filas paralelas para guiar las ruedas de los trenes y soportar su peso, actuando además como conductor de corriente de retorno y circuitos de vía.',
    securityContext: 'Prohibido pisar la cabeza del carril (superficie pulida y resbaladiza con alto riesgo de caída al balasto).',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Traviesa', 'Balasto', 'Circuito de vía']
  },
  {
    term: 'Catenaria (Línea Aérea de Contacto - LAC)',
    letter: 'C',
    category: 'Electrificación y Catenaria',
    definition: 'Conjunto de conductores aéreos de alimentación eléctrica suspendidos sobre las vías que suministran corriente de tracción al material motor mediante el frotamiento del pantógrafo. En España opera a 3.000 V en corriente continua (red convencional) o 25.000 V en corriente alterna (alta velocidad).',
    securityContext: '¡PELIGRO MORTAL DE ELECTROCUCIÓN! La catenaria y sus elementos de sustentación están sometidos a alta tensión. Mantener una distancia mínima de seguridad de 2 metros respecto a cualquier cable o elemento conductor.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Hilo de contacto', 'Pantógrafo', 'Subestación de Tracción', 'Zona de peligro']
  },
  {
    term: 'CECOM (Centro de Coordinación Operativa de Seguridad)',
    letter: 'C',
    category: 'Comunicaciones y Telemática',
    definition: 'Centro de mando y control H24 de ADIF encargado de la coordinación de la seguridad integral, gestión de vigilantes, respuesta ante intrusiones, incidencias de orden público y enlace con Fuerzas y Cuerpos de Seguridad del Estado.',
    securityContext: 'Canal directo de comunicación para los vigilantes de servicio para comunicar novedades, identificaciones de intrusos o solicitud de apoyo policial.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Puesto de Mando', 'Incidencia', 'Vigilante']
  },
  {
    term: 'Cerramiento perimetral',
    letter: 'C',
    category: 'Seguridad y Protección',
    definition: 'Valla metálica, malla electrosoldada o muro construido a lo largo de los márgenes de la infraestructura ferroviaria para impedir el acceso no autorizado de personas, vehículos y animales a la zona de peligro de la vía.',
    securityContext: 'La rotura, corte o forzamiento del cerramiento es la principal vía de intrusión para robos de cable y grafitis. Requiere reporte inmediato con punto kilométrico (PK).',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Punto Kilométrico', 'Zona de peligro', 'Intrusión']
  },
  {
    term: 'Circuito de vía',
    letter: 'C',
    category: 'Señalización y Bloqueo',
    definition: 'Circuito eléctrico en el que los propios carriles de la vía forman parte de los conductores. Cuando los ejes metálicos de un tren circulan por el tramo, cortocircuitan los carriles y detectan automáticamente la ocupación de la vía por el enclavamiento.',
    securityContext: 'Cables puente o cortes de carril pueden provocar la pérdida del circuito de vía ("ocupación intempestiva"). No depositar barras metálicas sobre ambos carriles.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Carril', 'Enclavamiento', 'Bloqueo Ferroviario']
  },
  {
    term: 'CTC (Control de Tráfico Centralizado)',
    letter: 'C',
    category: 'Comunicaciones y Telemática',
    definition: 'Sistema telemático centralizado que permite accionar a distancia los desvíos y señales de una línea o red desde un único puesto de mando central, regulando los itinerarios de circulación.',
    securityContext: 'Supervisa el tráfico de toda la red. Si una alarma de intrusión o detector de caída de objetos salta, el operador del CTC puede detener los trenes en cuestión de segundos.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#c',
    relatedTerms: ['Puesto de Mando', 'Enclavamiento', 'Itinerario']
  },

  // ==========================================
  // --- D ---
  // ==========================================
  {
    term: 'Desvío',
    letter: 'D',
    category: 'Vía e Infraestructura',
    definition: 'Aparato de vía que permite la bifurcación de una vía en dos o más ramas, permitiendo el paso de los vehículos de una vía a otra sin interrumpir la marcha.',
    securityContext: 'Lugar de maniobras donde convergen agujas y motores de accionamiento. Zona prohibida para estacionar vehículos de patrulla sobre la banqueta.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#d',
    relatedTerms: ['Aguja', 'Aparato de vía', 'Espadín']
  },
  {
    term: 'Detector de Cajas Calientes (DCC)',
    letter: 'D',
    category: 'Seguridad y Protección',
    definition: 'Dispositivo sensor infrarrojo ubicado en la vía que mide la temperatura de las cajas de grasa de los ejes de los trenes en marcha para detectar sobrecalentamientos antes de que se produzca un agarrotamiento o rotura de eje.',
    securityContext: 'Equipo de alta sensibilidad situado en los laterales de la vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#d',
    relatedTerms: ['Material rodante', 'Vía General', 'Seguridad']
  },
  {
    term: 'Detector de Caída de Objetos (DCO)',
    letter: 'D',
    category: 'Seguridad y Protección',
    definition: 'Malla sensora o cable detector instalado en pasos superiores y bocas de túnel que detecta si cae un objeto contundente, vehículo o desprendimiento sobre la traza de la vía, frenando automáticamente los trenes mediante el CTC.',
    securityContext: 'Revisión periódica de pasos superiores para verificar que no haya elementos colgados o manipulados por personas ajenas.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#d',
    relatedTerms: ['CTC', 'Paso superior', 'Zona de peligro']
  },

  // ==========================================
  // --- E ---
  // ==========================================
  {
    term: 'Enclavamiento',
    letter: 'E',
    category: 'Señalización y Bloqueo',
    definition: 'Sistema electromecánico o electrónico de seguridad que controla el movimiento y la relación de dependencia entre agujas, señales, pasos a nivel y circuitos de vía en una estación, garantizando que un tren solo reciba orden de marcha cuando su itinerario está completamente libre y cerrado.',
    securityContext: 'Cerebro de la seguridad de la estación. Su edificio técnico suele estar protegido con alarma de intrusión y control de accesos.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#e',
    relatedTerms: ['Aguja', 'Señal luminosa', 'Itinerario', 'CTC']
  },
  {
    term: 'ERTMS (European Rail Traffic Management System)',
    letter: 'E',
    category: 'Seguridad y Protección',
    definition: 'Estándar europeo unificado de señalización y control continuo de velocidad en cabina que sustituye a las señales laterales en líneas de alta velocidad y cercanías de alta densidad.',
    securityContext: 'Supervisa de forma continua la velocidad del tren mediante balizas Eurobalises y comunicaciones radio GSM-R.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#e',
    relatedTerms: ['ASFA', 'Baliza', 'GSM-R']
  },
  {
    term: 'Escape',
    letter: 'E',
    category: 'Vía e Infraestructura',
    definition: 'Dispositivo compuesto por dos desvíos continuos dispuestos en sentido contrario que permite el paso de un tren de una vía a otra paralela.',
    securityContext: 'Zona de cruce de vías que requiere máxima atención durante las rondas perimetrales.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#e',
    relatedTerms: ['Desvío', 'Aguja', 'Vía doble']
  },
  {
    term: 'Espadín',
    letter: 'E',
    category: 'Vía e Infraestructura',
    definition: 'Pieza móvil terminada en punta mecanizada que forma parte de la aguja y se acopla contra el carril exterior (contraaguja) para encauzar la pestaña de la rueda.',
    securityContext: 'Cualquier holgura no autorizada o rotura del espadín puede provocar el descarrilamiento de un tren.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#e',
    relatedTerms: ['Aguja', 'Desvío', 'Contraaguja']
  },

  // ==========================================
  // --- F (Oficial ADIF: Diccionario Ferroviario #f) ---
  // ==========================================
  {
    term: 'Facturación',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Operación administrativa y operativa de recepción, pesaje, registro y emisión del documento de porte para el transporte ferroviario de mercancías o paquetería.',
    securityContext: 'Control documental y precintado de vagones de mercancías frente a intrusiones, sustracciones o polizones.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Mercancías', 'Vagón', 'Furgón']
  },
  {
    term: 'Fanal',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Farol o foco de alumbrado y señalización de gran potencia montado en los testeros de cabeza o cola de las locomotoras y composiciones de tren para iluminar la vía e indicar la presencia y sentido de marcha del tren.',
    securityContext: 'Elemento preceptivo de visibilidad. La falta de fanal de cabeza o luces de cola rojas inhabilita la circulación nocturna del convoy.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Material rodante', 'Señalización', 'Marcha a la vista']
  },
  {
    term: 'Fardería',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Conjunto de bultos, fardos o paquetes que se transportaban tradicionalmente en los furgones de trenes de viajeros o mercancías con tarifas especiales.',
    securityContext: 'Zona de carga y descarga de paquetería en muelles de estación con vigilancia de mercancías.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Furgón', 'Facturación', 'Muelle de carga']
  },
  {
    term: 'Fase (Separación de Fase en Catenaria)',
    letter: 'F',
    category: 'Electrificación y Catenaria',
    definition: 'Tramo de neutro o zona de separación aérea en la catenaria que divide dos sectores de alimentación eléctrica conectados a fases distintas de la red de alta tensión, evitando cortocircuitos entre subestaciones.',
    securityContext: 'Zona no energizada donde el maquinista desconecta el disyuntor principal del tren. ¡Riesgo grave si un tren se queda detenido en zona neutra!',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Catenaria', 'Zona neutra', 'Subestación de Tracción', 'Pantógrafo']
  },
  {
    term: 'Ferrobús',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Vehículo automotor ferroviario ligero autopropulsado por motor diésel y concebido para el transporte de viajeros en líneas secundarias o regionales con baja demanda.',
    securityContext: 'Material rodante de gálibo ligero que requiere las mismas precauciones de seguridad en vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Material rodante', 'Vía General', 'Apeadero']
  },
  {
    term: 'Fibra óptica (Red Troncal ADIF)',
    letter: 'F',
    category: 'Comunicaciones y Telemática',
    definition: 'Cable subterráneo o aéreo compuesto por fibras de vidrio dieléctricas tendido por las canaletas perimetrales de hormigón de ADIF. Conecta enclavamientos, CTC, telefonía de emergencia, sistemas de señalización y circuitos de seguridad.',
    securityContext: 'Infraestructura crítica del Estado. El corte de canaletas o intento de sustracción provoca la caída inmediata del CTC, parada general de trenes y delito muy grave contra la seguridad colectiva.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Canaleta de cables', 'CTC', 'GSM-R', 'Cerramiento perimetral']
  },
  {
    term: 'Fijación de vía',
    letter: 'F',
    category: 'Vía e Infraestructura',
    definition: 'Sistema mecánico elástico (grapas Pandrol, clips Nabla, placas de asiento y tirafondos) que une firmemente el patín del carril con la traviesa, absorbiendo las vibraciones y garantizando el ancho de vía.',
    securityContext: 'La manipulación o retirada de fijaciones desestabiliza la vía y genera riesgo inmediato de descarrilamiento.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Carril', 'Traviesa', 'Ancho de vía']
  },
  {
    term: 'Foso de visita (o Foso de inspección)',
    letter: 'F',
    category: 'Vía e Infraestructura',
    definition: 'Trinchera o zanja longitudinal practicada entre los carriles de una vía de taller, depósito o estación que permite a los operarios colocarse de pie bajo el tren para inspeccionar bogies, frenos, motores y bajos del material rodante.',
    securityContext: 'Riesgo de caídas a distinto nivel. Durante las inspecciones de seguridad debe iluminarse adecuadamente y comprobar que la catenaria superior esté descargada si se accede a techos.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Bogie', 'Material rodante', 'Taller ferroviario']
  },
  {
    term: 'Frecuencia de paso',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Número de trenes o circulaciones que pasan por un punto o línea determinada durante un intervalo de tiempo concreto (habitualmente por hora).',
    securityContext: 'En líneas con alta frecuencia (cercanías de Barcelona), los intervalos de seguridad son mínimos; está totalmente prohibido invadir la zona de peligro sin corte de vía acordado con el Puesto de Mando.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Cantón', 'Puesto de Mando', 'Zona de peligro']
  },
  {
    term: 'Freno automático (Freno continuo de aire comprimido)',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Sistema de freno que actúa simultáneamente en todos los vehículos de una composición mediante la bajada de presión en la tubería de freno general (TFG). Es de diseño intrínsecamente seguro: si la composición se parte o se rompe la tubería, los trenes se frenan de forma automática e inmediata.',
    securityContext: 'En caso de sabotaje o manipulación de llaves de corte de aire por intrusos o grafiteros, el tren queda inmovilizado con alarma neumática.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Material rodante', 'ASFA', 'Freno de estacionamiento']
  },
  {
    term: 'Freno de husillo (Freno de mano)',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Mecanismo de frenado manual accionado mediante una manivela o volante que presiona mecánicamente las zapatas contra las ruedas para asegurar la inmovilización de vehículos estacionados sin aire comprimido.',
    securityContext: 'Comprobación obligatoria en vagones y locomotoras estacionados en vías con pendiente para evitar que se escapen a vías generales.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Calce de vía', 'Mango de vía', 'Material rodante']
  },
  {
    term: 'Freno de patín electromagnético',
    letter: 'F',
    category: 'Seguridad y Protección',
    definition: 'Dispositivo de frenado de urgencia utilizado en trenes de alta velocidad y automotores que consiste en patines imantados que descienden directamente sobre las cabezas de los carriles, aplicando una fuerza de fricción magnética muy elevada sin depender de la adherencia rueda-carril.',
    securityContext: 'Frenado de máxima deceleración ante situaciones de peligro inminente o rebase imprevisto.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Carril', 'Freno automático', 'ERTMS']
  },
  {
    term: 'Fuelle de intercomunicación',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Estructura flexible en forma de acordeón fabricada con lona engomada o caucho que une dos coches de viajeros consecutivos, protegiendo el pasillo de paso del viento, lluvia y ruido.',
    securityContext: 'Zona exterior de peligro donde intrusos o grafiteros intentan encaramarse para viajar fuera del tren ("train surfing").',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Material rodante', 'Zona de peligro']
  },
  {
    term: 'Furgón',
    letter: 'F',
    category: 'Operaciones y Tráfico',
    definition: 'Vehículo ferroviario remolcado o compartimento especial de una unidad automotora destinado al transporte de paquetería, equipajes, bicicletas, repuestos o grupos electrógenos auxiliares.',
    securityContext: 'Espacio de carga cerrado con precintos de seguridad.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#f',
    relatedTerms: ['Facturación', 'Material rodante', 'Mercancías']
  },

  // ==========================================
  // --- G ---
  // ==========================================
  {
    term: 'Gálibo',
    letter: 'G',
    category: 'Seguridad y Protección',
    definition: 'Contorno límite poligonal que determina las dimensiones máximas que puede tener el material rodante y su carga (gálibo de material) y el espacio mínimo libre de obstáculos que debe existir alrededor de la vía para permitir el paso seguro de los trenes (gálibo de infraestructura).',
    securityContext: 'Cualquier vehículo de seguridad, andamio, valla o poste situado dentro del gálibo representa un obstáculo fatal para la circulación ferroviaria.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#g',
    relatedTerms: ['Zona de peligro', 'Piquete de entrevías', 'Andén']
  },
  {
    term: 'GSM-R (Global System for Mobile Communications - Railway)',
    letter: 'G',
    category: 'Comunicaciones y Telemática',
    definition: 'Sistema de comunicaciones inalámbricas digitales exclusivo para el ámbito ferroviario que permite la comunicación de voz y datos entre trenes, maquinistas, puestos de mando y personal de mantenimiento de ADIF.',
    securityContext: 'Infraestructura de telecomunicaciones crítica. Las antenas BTS de GSM-R a lo largo de la traza están protegidas perimetralmente.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#g',
    relatedTerms: ['Tren-Tierra', 'Puesto de Mando', 'ERTMS']
  },

  // ==========================================
  // --- H ---
  // ==========================================
  {
    term: 'Hilo de contacto',
    letter: 'H',
    category: 'Electrificación y Catenaria',
    definition: 'Cable conductor de cobre o aleación de cobre ranurado en su parte superior que pende de la catenaria mediante péndolas y sobre el cual deslizan los frotadores del pantógrafo del tren para captar la corriente eléctrica.',
    securityContext: 'Conductor con corriente a 3.000 V o 25.000 V. Si un hilo se desprende o rompe, la zona se convierte en área de riesgo extremo de arco eléctrico.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#h',
    relatedTerms: ['Catenaria', 'Pantógrafo', 'Péndola']
  },
  {
    term: 'Hito kilométrico',
    letter: 'H',
    category: 'Vía e Infraestructura',
    definition: 'Mojón de piedra, placa metálica o señal situada a los lados de la vía cada kilómetro o hectómetro para marcar el Punto Kilométrico (PK) exacto de la línea ferroviaria.',
    securityContext: 'Referencia geográfica indispensable para que las patrullas localicen incidencias y coordinen a los servicios de emergencia.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#h',
    relatedTerms: ['Punto Kilométrico', 'Línea ferroviaria']
  },

  // ==========================================
  // --- I ---
  // ==========================================
  {
    term: 'Intervención de emergencia',
    letter: 'I',
    category: 'Seguridad y Protección',
    definition: 'Conjunto de actuaciones coordinadas entre el Puesto de Mando, CECOM, empresas de seguridad y servicios de emergencia (Mossos, Bombers, SEM) ante accidentes, arrollamientos o amenazas en la infraestructura ferroviaria.',
    securityContext: 'Requiere la confirmación fehaciente del corte de tensión en catenaria y la interrupción de la circulación antes de que los equipos de rescate pisen la vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#i',
    relatedTerms: ['CECOM', 'Puesto de Mando', 'Catenaria']
  },
  {
    term: 'Itinerario',
    letter: 'I',
    category: 'Operaciones y Tráfico',
    definition: 'Trayecto fijado y asegurado por un enclavamiento para el paso de un tren entre dos puntos de una estación o línea con todas las agujas posicionadas y acerrojadas.',
    securityContext: 'Una vez establecido un itinerario, no puede ser modificado hasta que el tren complete su paso o se ejecute una anulación reglamentaria.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#i',
    relatedTerms: ['Enclavamiento', 'Aguja', 'Señal luminosa']
  },

  // ==========================================
  // --- J ---
  // ==========================================
  {
    term: 'Jácena ferroviaria',
    letter: 'J',
    category: 'Vía e Infraestructura',
    definition: 'Viga maestra de gran resistencia (de acero, hormigón armado o pretensado) utilizada en viaductos y puentes ferroviarios para salvar grandes luces sobre ríos, carreteras u otras vías de tren.',
    securityContext: 'Estructura de obra civil bajo constante inspección para evitar fisuras o vibraciones anómalas.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#j',
    relatedTerms: ['Vía e Infraestructura', 'Viaducto']
  },

  // ==========================================
  // --- L ---
  // ==========================================
  {
    term: 'Línea Ferroviaria de Interés General (RFIG)',
    letter: 'L',
    category: 'Operaciones y Tráfico',
    definition: 'Conjunto de vías, estaciones e infraestructuras administradas por ADIF que forman la red estatal esencial para el transporte nacional e internacional de viajeros y mercancías.',
    securityContext: 'Marco donde se aplican las competencias de seguridad privada, RCF y coordinación con Fuerzas de Seguridad.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#l',
    relatedTerms: ['Puesto de Mando', 'RCF', 'ADIF']
  },

  // ==========================================
  // --- M ---
  // ==========================================
  {
    term: 'Mango de vía (o Vía Mango)',
    letter: 'M',
    category: 'Operaciones y Tráfico',
    definition: 'Vía muerta sin salida de corta longitud (habitualmente con topera al final) conectada a un haz de vías, utilizada para el estacionamiento temporal de locomotoras, máquinas de maniobra o como vía de escape de seguridad.',
    securityContext: 'Lugar de alto riesgo de intrusiones nocturnas y grafitis al estacionar en ellas unidades de tren en horas valle. Punto clave en rondas de vigilancia de patrulla.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#m',
    relatedTerms: ['Topera', 'Vía de escape', 'Maniobra']
  },
  {
    term: 'Ménsula de catenaria',
    letter: 'M',
    category: 'Electrificación y Catenaria',
    definition: 'Brazo tubular oscilante o estructura articulada fijada al poste de catenaria que sustenta los aisladores, el cable sustentador y el hilo de contacto sobre el eje de la vía.',
    securityContext: 'Elemento energizado en su tramo interior a través de los aisladores. Mantener distancia de seguridad.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#m',
    relatedTerms: ['Catenaria', 'Hilo de contacto', 'Aislador']
  },

  // ==========================================
  // --- N ---
  // ==========================================
  {
    term: 'Notificación reglamentaria',
    letter: 'N',
    category: 'Operaciones y Tráfico',
    definition: 'Documento o mensaje formal que el responsable de circulación o Puesto de Mando entrega por escrito o transmite por telefonema al maquinista para advertirle de condiciones anormales (limitación temporal de velocidad, marcha a la vista, avería de señales, etc.).',
    securityContext: 'Procedimiento formal obligatorio para garantizar que el maquinista conoce la presencia de trabajos o vigilantes en vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#n',
    relatedTerms: ['Telefonema', 'Puesto de Mando', 'RCF']
  },

  // ==========================================
  // --- O ---
  // ==========================================
  {
    term: 'Obstrucción de vía',
    letter: 'O',
    category: 'Seguridad y Protección',
    definition: 'Presencia accidental o deliberada de personas, vehículos, ramas, piedras, escombros o material rodante que invade el gálibo e impide la marcha segura de los trenes.',
    securityContext: 'Situación de emergencia máxima. El vigilante que detecte una obstrucción debe dar aviso inmediato a CECOM/Puesto de Mando para la detención inmediata de circulaciones.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#o',
    relatedTerms: ['Zona de peligro', 'Gálibo', 'Puesto de Mando']
  },

  // ==========================================
  // --- P ---
  // ==========================================
  {
    term: 'Pantógrafo',
    letter: 'P',
    category: 'Electrificación y Catenaria',
    definition: 'Dispositivo articulado montado en el techo de los vehículos tractores (locomotoras, trenes autopropulsados) provisto de una pletina de frotamiento que se eleva por presión neumática para captar corriente de la catenaria.',
    securityContext: 'Un pantógrafo roto o enganchado en la catenaria ("enganche") puede arrancar cientos de metros de hilo conductor, provocando averías graves y caída de cables con tensión al suelo.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Catenaria', 'Hilo de contacto', 'Material rodante']
  },
  {
    term: 'Paso a Nivel (PN)',
    letter: 'P',
    category: 'Seguridad y Protección',
    definition: 'Intersección al mismo nivel entre una carretera o camino y una línea ferroviaria, protegida con semibarreras automáticas, señales luminosas o advertencia acústica.',
    securityContext: 'Punto crítico de riesgo de arrollamiento y colisión de vehículos. Los vigilantes deben supervisar que las barreras no estén atascadas ni manipuladas por peatones.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Enclavamiento', 'Señal luminosa', 'Zona de peligro']
  },
  {
    term: 'Péndola',
    letter: 'P',
    category: 'Electrificación y Catenaria',
    definition: 'Cable vertical flexible que une el cable sustentador superior de la catenaria con el hilo de contacto inferior, manteniéndolo a una altura constante y paralela a la vía.',
    securityContext: 'Elemento energizado de la línea aérea de contacto.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Catenaria', 'Hilo de contacto', 'Sustentador']
  },
  {
    term: 'Peralte',
    letter: 'P',
    category: 'Vía e Infraestructura',
    definition: 'Elevación que se da al carril exterior respecto al carril interior en las curvas de la vía para compensar la fuerza centrífuga que experimentan los trenes y mejorar el confort y la seguridad de marcha.',
    securityContext: 'Afecta a la inclinación del material rodante en las curvas.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Curva', 'Carril', 'Gálibo']
  },
  {
    term: 'Piquete de entrevías',
    letter: 'P',
    category: 'Seguridad y Protección',
    definition: 'Mojón o prisma de hormigón pintado con franjas blancas y negras, colocado en el ángulo donde convergen dos vías férreas. Delimita el punto más próximo al cruce donde un vehículo puede estar estacionado sin peligro de ser alcanzado por trenes que circulen por la otra vía.',
    securityContext: 'Concepto fundamental de seguridad en maniobras y estacionamiento: un tren o vagón situado rebasando el piquete invade el gálibo de la vía contigua y provocará una colisión lateral.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Gálibo', 'Desvío', 'Vía de apartado']
  },
  {
    term: 'Puesto de Mando (PM)',
    letter: 'P',
    category: 'Operaciones y Tráfico',
    definition: 'Centro neurálgico permanente de ADIF desde el cual los reguladores de circulación coordinan y supervisan en tiempo real todo el tráfico ferroviario, las incidencias, las averías y la seguridad de las líneas de una demarcación territorial.',
    securityContext: 'Toda incidencia grave en vía (intrusión, personas en vía, obstáculos) debe comunicarse al Puesto de Mando directamente o a través de CECOM para detener trenes preventivamente.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['CECOM', 'CTC', 'Regulador de circulación']
  },
  {
    term: 'Punto Kilométrico (PK)',
    letter: 'P',
    category: 'Vía e Infraestructura',
    definition: 'Sistema de georreferenciación lineal oficial de la red ferroviaria mediante hitos o placas situadas cada kilómetro y hectómetro a lo largo de la traza para localizar con exactitud cualquier punto de la línea (ej: PK 652+300).',
    securityContext: 'Dato imprescindible en cualquier informe o llamada de emergencia: sin el PK exacto los servicios de seguridad, bomberos y policía no pueden localizar el punto de intervención en vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#p',
    relatedTerms: ['Hito', 'Línea ferroviaria', 'Incidencia']
  },

  // ==========================================
  // --- R ---
  // ==========================================
  {
    term: 'RCF (Reglamento de Circulación Ferroviaria)',
    letter: 'R',
    category: 'Seguridad y Protección',
    definition: 'Conjunto oficial de normas y prescripciones de carácter técnico y operativo dictadas por la Agencia Estatal de Seguridad Ferroviaria (AESF) que regulan la gestión de la circulación segura de trenes en la Red Ferroviaria de Interés General (RFIG).',
    securityContext: 'Marco normativo que rige todas las autorizaciones, cortes de vía y actuaciones de seguridad en las instalaciones de ADIF.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#r',
    relatedTerms: ['Bloqueo Ferroviario', 'Puesto de Mando', 'Telefonema']
  },
  {
    term: 'Rebase autorizado',
    letter: 'R',
    category: 'Operaciones y Tráfico',
    definition: 'Autorización formal emitida por el responsable de circulación al maquinista mediante telefonema reglamentario para rebasar una señal fija en indicación de parada cuando se ha producido una avería en las instalaciones.',
    securityContext: 'Situación operativa delicada donde el maquinista debe avanzar con marcha de maniobras o marcha a la vista.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#r',
    relatedTerms: ['Señal de Parada', 'Telefonema', 'Puesto de Mando']
  },

  // ==========================================
  // --- S ---
  // ==========================================
  {
    term: 'Señal de Parada (o Señal en Rojo)',
    letter: 'S',
    category: 'Señalización y Bloqueo',
    definition: 'Señal fija luminosa o mecánica que ordena imperativamente al maquinista detener el tren antes de rebasarla.',
    securityContext: 'El rebase no autorizado de una señal en parada ("SPAD" o rebase indebido) es una falta muy grave de seguridad que activa el frenado ASFA automático.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#s',
    relatedTerms: ['ASFA', 'Bloqueo Ferroviario', 'Enclavamiento']
  },
  {
    term: 'Subestación de Tracción',
    letter: 'S',
    category: 'Electrificación y Catenaria',
    definition: 'Instalación eléctrica industrial que transforma y rectifica la energía eléctrica de alta tensión procedente de la red general de distribución para inyectarla a la catenaria con las características requeridas por los trenes.',
    securityContext: 'Recinto de alta seguridad con protecciones perimetrales, videovigilancia y prohibición absoluta de entrada sin autorización y descargo de tensión.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#s',
    relatedTerms: ['Catenaria', 'Transformador', 'Descargo']
  },

  // ==========================================
  // --- T ---
  // ==========================================
  {
    term: 'Talonamiento (o Talonar una aguja)',
    letter: 'T',
    category: 'Vía e Infraestructura',
    definition: 'Acción por la cual las ruedas de un vehículo ferroviario fuerzan la apertura de una aguja tomada de talón cuando esta no estaba dispuesta para su itinerario. Si la aguja no es de tipo talonable, el mecanismo queda dañado e inservible.',
    securityContext: 'Avería que inhabilita el desvío y bloquea la circulación de la estación.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#t',
    relatedTerms: ['Aguja', 'Desvío', 'Enclavamiento']
  },
  {
    term: 'Telefonema',
    letter: 'T',
    category: 'Comunicaciones y Telemática',
    definition: 'Comunicación oficial reglamentaria transmitida verbalmente por radio o teléfono y registrada por escrito en libros reglamentarios con número de orden, hora y texto normalizado entre responsables de circulación para autorizar maniobras, bloqueos o cortes de vía.',
    securityContext: 'Documento legalmente vinculante ante incidentes o accidentes de circulación.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#t',
    relatedTerms: ['RCF', 'Tren-Tierra', 'Puesto de Mando']
  },
  {
    term: 'Topera',
    letter: 'T',
    category: 'Vía e Infraestructura',
    definition: 'Estructura fija o deformable instalada al final de una vía muerta o mango para detener el material rodante en caso de fallo de frenada o rebase accidental. Las toperas hidráulicas o de fricción disipan la energía cinética del impacto.',
    securityContext: 'Extremo de vía de maniobras; zona que debe permanecer despejada de escombros o materiales durante los patrullajes.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#t',
    relatedTerms: ['Mango de vía', 'Calce de vía', 'Vía muerta']
  },
  {
    term: 'Traviesa',
    letter: 'T',
    category: 'Vía e Infraestructura',
    definition: 'Elemento transversal al eje de la vía (de hormigón pretensado monobloque, bibloque o madera tratada) sobre el que se apoyan y fijan los carriles mediante sujeciones elásticas, manteniendo constante el ancho de vía y repartiendo las cargas al balasto.',
    securityContext: 'Vigilancia de fijaciones: la sustracción de tirafondos o clips de sujeción compromete la estabilidad de la vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#t',
    relatedTerms: ['Carril', 'Balasto', 'Ancho de vía']
  },
  {
    term: 'Tren-Tierra',
    letter: 'T',
    category: 'Comunicaciones y Telemática',
    definition: 'Sistema analógico de radiotelefonía que enlaza la cabina de conducción de los trenes con el puesto central de mando y los puestos fijos distribuidos por la línea férrea.',
    securityContext: 'Medio de comunicación para alertas inmediatas entre maquinistas y reguladores.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#t',
    relatedTerms: ['GSM-R', 'Puesto de Mando', 'Telefonema']
  },

  // ==========================================
  // --- V ---
  // ==========================================
  {
    term: 'Vía General',
    letter: 'V',
    category: 'Operaciones y Tráfico',
    definition: 'Vía destinada preferentemente a la circulación continua de trenes directos o pasantes en una línea o estación, a diferencia de las vías de apartado o de maniobras.',
    securityContext: 'Vía de máxima velocidad y prioridad. Prohibida cualquier aproximación al gálibo sin corte de vía acordado con el Puesto de Mando.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#v',
    relatedTerms: ['Vía de apartado', 'Gálibo', 'Bloqueo Ferroviario']
  },
  {
    term: 'Vía de Apartado',
    letter: 'V',
    category: 'Operaciones y Tráfico',
    definition: 'Vía auxiliar en una estación o apartadero conectada por desvíos a la vía general, utilizada para apartar trenes más lentos, permitir cruces o realizar labores de carga y descarga.',
    securityContext: 'Área habitual donde se estacionan convoyes de mercancías o unidades en reserva, objetivo frecuente de robos de combustible y grafitis.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#v',
    relatedTerms: ['Vía General', 'Mango de vía', 'Desvío']
  },

  // ==========================================
  // --- Z ---
  // ==========================================
  {
    term: 'Zona de peligro de la vía',
    letter: 'Z',
    category: 'Seguridad y Protección',
    definition: 'Espacio delimitado a ambos lados de la vía férrea (generalmente 2 metros desde la cara exterior del carril más próximo) en el que una persona u objeto corre riesgo inminente de arrollamiento o de ser alcanzado por el gálibo cinemático o la turbulencia de aire de un tren en circulación.',
    securityContext: 'Norma de seguridad fundamental para el personal de vigilancia: nunca invadir la zona de peligro sin autorización expresa, chaleco reflectante y acreditación oficial de personal de seguridad en vía.',
    sourceUrl: 'https://www.adif.es/comunicacion/diccionario-ferroviario#z',
    relatedTerms: ['Gálibo', 'Catenaria', 'Piquete de entrevías']
  }
];

export const DICTIONARY_CATEGORIES = [
  'Todas',
  'Vía e Infraestructura',
  'Electrificación y Catenaria',
  'Señalización y Bloqueo',
  'Seguridad y Protección',
  'Operaciones y Tráfico',
  'Comunicaciones y Telemática'
] as const;
