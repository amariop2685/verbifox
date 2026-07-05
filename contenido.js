/* ============================================================
   VerbiFox · Motor de contenidos (todas las materias)
   Afinado al sello Boston College: inglés (inmersión), ecología,
   valores/virtudes y pensamiento crítico (retos de orden superior).
   Unidad: { id,nombre,emoji,oa,intro,img?, items:[{t,d,e,en?}],
             datos:[...], retos:[{q,ops:[...],correcta,porque}] }
   ============================================================ */
window.CONTENIDO = {
  ciencias: {
    nombre:'Ciencias Naturales', emoji:'🔬', lang:'es-CL',
    cursos: {
      "5": [
        { id:'microorganismos', nombre:'Microorganismos y salud', emoji:'🦠',
          oa:'OA2: reconocer microorganismos y su efecto en la salud',
          intro:'Los microorganismos son seres vivos tan pequeños que solo se ven con microscopio.',
          items:[
            {t:'Microorganismo', en:'microorganism', d:'Ser vivo muy pequeño que solo se ve con microscopio.', e:'🦠'},
            {t:'Bacteria', en:'bacteria', d:'Microorganismo de una sola célula; algunas ayudan y otras enferman.', e:'🧫'},
            {t:'Virus', en:'virus', d:'Diminuto; necesita otra célula para reproducirse.', e:'🦠'},
            {t:'Hongo', en:'fungus', d:'Como el moho o la levadura; algunos sirven para hacer pan.', e:'🍄'},
            {t:'Vacuna', en:'vaccine', d:'Preparado que enseña al cuerpo a defenderse de una enfermedad.', e:'💉'},
            {t:'Antibiótico', en:'antibiotic', d:'Medicamento que combate bacterias (no sirve para virus).', e:'💊'},
          ],
          datos:['Lavarse las manos elimina muchos microorganismos dañinos.','No todos los microbios son malos: algunos viven en tu intestino y te ayudan.'],
          retos:[
            {q:'Tu amigo tiene un resfrío, causado por un VIRUS. ¿Le sirve tomar un antibiótico?',
             ops:['No, los antibióticos solo combaten bacterias','Sí, los antibióticos curan todo','Sí, pero solo de noche'], correcta:0,
             porque:'Los antibióticos actúan sobre bacterias, no sobre virus. Por eso un resfrío viral no se cura con antibióticos.'},
            {q:'¿Cuál es la forma más simple y efectiva de evitar contagiar microbios a tu familia?',
             ops:['Lavarse bien las manos','No hablar con nadie','Tomar mucha agua fría'], correcta:0,
             porque:'La higiene de manos corta la cadena de contagio: es simple, gratis y muy efectiva.'},
          ] },
        { id:'defensas', nombre:'Las defensas del cuerpo', emoji:'🛡️',
          oa:'OA3: describir barreras y defensas del cuerpo humano',
          intro:'Tu cuerpo tiene barreras que impiden la entrada de microorganismos.',
          items:[
            {t:'Piel', en:'skin', d:'Barrera que cubre el cuerpo e impide la entrada de microbios.', e:'🧍'},
            {t:'Mucosa', en:'mucous membrane', d:'Capa húmeda (nariz, boca) que atrapa microorganismos.', e:'👃'},
            {t:'Glóbulos blancos', en:'white blood cells', d:'Células de la sangre que defienden al cuerpo.', e:'⚪'},
            {t:'Fiebre', en:'fever', d:'Aumento de temperatura que ayuda a combatir infecciones.', e:'🌡️'},
            {t:'Higiene', en:'hygiene', d:'Hábitos de limpieza que previenen enfermedades.', e:'🧼'},
            {t:'Sistema inmune', en:'immune system', d:'Conjunto de defensas que protege todo tu cuerpo.', e:'🛡️'},
          ],
          datos:['Estornudar tapándote con el codo evita contagiar a otros: eso es respeto por los demás.','Dormir bien y comer sano fortalecen tus defensas.'],
          retos:[
            {q:'La piel se corta y entran bacterias. ¿Qué defensa del cuerpo llega a combatirlas?',
             ops:['Los glóbulos blancos','El pelo','Las uñas'], correcta:0,
             porque:'Cuando una barrera (la piel) falla, los glóbulos blancos actúan como "soldados" que atacan a los microbios.'},
          ] },
        { id:'materia', nombre:'La materia y sus propiedades', emoji:'⚗️',
          oa:'Reconocer propiedades de la materia (masa, volumen, estados)',
          intro:'Todo lo que ocupa espacio y tiene masa es materia.',
          img:'img/ciencias/estados-materia.svg',
          items:[
            {t:'Materia', en:'matter', d:'Todo lo que tiene masa y ocupa un lugar en el espacio.', e:'🧊'},
            {t:'Masa', en:'mass', d:'Cantidad de materia de un objeto; se mide en gramos.', e:'⚖️'},
            {t:'Volumen', en:'volume', d:'Espacio que ocupa un objeto.', e:'📦'},
            {t:'Sólido', en:'solid', d:'Estado con forma y volumen fijos (ej: hielo).', e:'🧊'},
            {t:'Líquido', en:'liquid', d:'Fluye y toma la forma del recipiente (ej: agua).', e:'💧'},
            {t:'Gaseoso', en:'gas', d:'Ocupa todo el espacio disponible (ej: vapor).', e:'💨'},
          ],
          datos:['El agua puede ser sólida (hielo), líquida o gaseosa (vapor): ¡la misma materia en 3 estados!'],
          retos:[
            {q:'Inflas un globo con aire. ¿Por qué el aire ocupa TODO el globo?',
             ops:['Porque es un gas y ocupa todo el espacio disponible','Porque el aire es sólido','Porque el globo tiene agua'], correcta:0,
             porque:'Los gases no tienen forma propia: se expanden hasta ocupar todo el espacio del recipiente (el globo).'},
          ] },
        { id:'mezclas', nombre:'Mezclas y separación', emoji:'🧪',
          oa:'Identificar mezclas y métodos para separarlas',
          intro:'Una mezcla se forma al juntar dos o más materiales.',
          items:[
            {t:'Mezcla', en:'mixture', d:'Unión de dos o más materiales que no se transforman.', e:'🥣'},
            {t:'Homogénea', en:'homogeneous', d:'No se distinguen sus partes (ej: agua con sal).', e:'🧂'},
            {t:'Heterogénea', en:'heterogeneous', d:'Se distinguen sus partes (ej: ensalada).', e:'🥗'},
            {t:'Filtración', en:'filtration', d:'Separar un sólido de un líquido con un filtro.', e:'☕'},
            {t:'Evaporación', en:'evaporation', d:'Separar por calor: el líquido se va y queda el sólido.', e:'♨️'},
          ],
          datos:['El agua con arena se separa por filtración; el agua con sal, por evaporación.'],
          retos:[
            {q:'Tienes agua con sal disuelta y quieres recuperar la sal. ¿Qué método usas?',
             ops:['Evaporación (calientas y el agua se va)','Filtración con un colador','La congelas'], correcta:0,
             porque:'La sal está disuelta, así que un filtro no la separa. Al evaporar el agua, la sal queda en el fondo.'},
          ] },
        { id:'agua', nombre:'El agua en la Tierra', emoji:'💧',
          oa:'Describir la distribución del agua y su ciclo',
          intro:'La mayor parte del agua de la Tierra está en los océanos.',
          img:'img/ciencias/ciclo-agua.svg',
          items:[
            {t:'Ciclo del agua', en:'water cycle', d:'Recorrido del agua entre la Tierra, el cielo y de vuelta.', e:'🔁'},
            {t:'Evaporación', en:'evaporation', d:'El agua se calienta y sube como vapor.', e:'☀️'},
            {t:'Condensación', en:'condensation', d:'El vapor se enfría y forma las nubes.', e:'☁️'},
            {t:'Precipitación', en:'precipitation', d:'El agua cae como lluvia, nieve o granizo.', e:'🌧️'},
            {t:'Agua dulce', en:'fresh water', d:'Sin sal, de ríos, lagos y glaciares.', e:'🏞️'},
          ],
          datos:['Casi toda el agua del planeta es salada; muy poca es dulce y potable.'],
          retos:[
            {q:'Cierras la llave mientras te cepillas los dientes. ¿Por qué esto cuida el planeta?',
             ops:['Porque el agua dulce potable es escasa y hay que ahorrarla','Porque el agua salada se acaba','Porque así crecen las nubes'], correcta:0,
             porque:'El agua dulce potable es muy escasa. Cuidarla es una responsabilidad de todos con el medio ambiente. 🌍'},
          ] },
        { id:'ecosistemas', nombre:'Ecosistemas y medio ambiente', emoji:'🌳',
          oa:'Comprender relaciones en un ecosistema y cuidarlo',
          intro:'Un ecosistema son los seres vivos y su entorno, conectados entre sí.',
          items:[
            {t:'Ecosistema', en:'ecosystem', d:'Seres vivos y su entorno relacionados entre sí.', e:'🌳'},
            {t:'Productor', en:'producer', d:'Ser que fabrica su alimento (las plantas, con el Sol).', e:'🌱'},
            {t:'Consumidor', en:'consumer', d:'Ser que se alimenta de otros (animales).', e:'🐇'},
            {t:'Cadena alimentaria', en:'food chain', d:'Quién se alimenta de quién en un ecosistema.', e:'🔗'},
            {t:'Reciclar', en:'to recycle', d:'Reusar materiales para cuidar el planeta.', e:'♻️'},
          ],
          datos:['Las plantas son la base de casi toda cadena alimentaria: sin ellas, no habría alimento.','Reciclar y no botar basura protege los ecosistemas. Es un acto de respeto por la vida.'],
          retos:[
            {q:'En un prado: pasto → conejo → zorro. Si desaparece TODO el pasto, ¿qué pasa primero?',
             ops:['Los conejos se quedan sin alimento y disminuyen','El zorro come pasto','No pasa nada'], correcta:0,
             porque:'El pasto es el productor (base). Sin él, los conejos (que lo comen) se quedan sin alimento y bajan; luego afecta al zorro.'},
          ] },
        { id:'pubertad', nombre:'La pubertad y el autocuidado', emoji:'🌱',
          oa:'OA1: reconocer cambios de la pubertad y el autocuidado',
          intro:'La pubertad es la etapa en que el cuerpo crece y cambia para dejar de ser niño.',
          items:[
            {t:'Pubertad', en:'puberty', d:'Etapa de crecimiento y cambios del cuerpo.', e:'🌱'},
            {t:'Autocuidado', en:'self-care', d:'Cuidar tu cuerpo, tu higiene y tus emociones.', e:'🧡'},
            {t:'Higiene', en:'hygiene', d:'Hábitos de limpieza diarios (ducha, dientes).', e:'🧼'},
            {t:'Respeto', en:'respect', d:'Valorar el cuerpo y las emociones, propias y de los demás.', e:'🤝'},
            {t:'Emociones', en:'emotions', d:'Lo que sientes; en esta etapa pueden cambiar más.', e:'😊'},
          ],
          datos:['Todos crecen a su propio ritmo: no hay uno "mejor". Respeta el tuyo y el de los demás.','Hablar con un adulto de confianza sobre tus dudas es señal de madurez, no de debilidad.'],
          retos:[
            {q:'Un compañero se burla de otro porque está creciendo distinto. ¿Qué es lo correcto?',
             ops:['Defender el respeto: cada cuerpo cambia a su ritmo','Reírse también','Ignorar siempre todo'], correcta:0,
             porque:'Cada persona crece a su ritmo. El respeto y la sana convivencia son valores que nos hacen mejores. 🤝'},
          ] },
      ]
    }
  }
};
