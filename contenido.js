/* ============================================================
   VerbiFox · Motor de contenidos (todas las materias)
   Estructura: CONTENIDO[materia] = { nombre, emoji, lang, cursos:{ "5":[unidades] } }
   Unidad: { id, nombre, emoji, oa, intro, items:[{t:'término', d:'definición', e:emoji}], datos:[textos] }
   El quiz se genera solo: se muestra el término y se elige su definición.
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
            {t:'Microorganismo', d:'Ser vivo muy pequeño que solo se ve con microscopio.', e:'🦠'},
            {t:'Bacteria', d:'Microorganismo de una sola célula; algunas ayudan y otras enferman.', e:'🧫'},
            {t:'Virus', d:'Microorganismo diminuto que necesita otra célula para reproducirse.', e:'🦠'},
            {t:'Hongo', d:'Ser vivo como el moho o la levadura; algunos sirven para hacer pan.', e:'🍄'},
            {t:'Vacuna', d:'Preparado que enseña al cuerpo a defenderse de una enfermedad.', e:'💉'},
            {t:'Antibiótico', d:'Medicamento que combate bacterias (no sirve para virus).', e:'💊'},
          ],
          datos:['Lavarse las manos elimina muchos microorganismos dañinos.','No todos los microbios son malos: algunos viven en tu intestino y te ayudan.'] },
        { id:'defensas', nombre:'Las defensas del cuerpo', emoji:'🛡️',
          oa:'OA3: describir barreras y defensas del cuerpo humano',
          intro:'Tu cuerpo tiene barreras que impiden la entrada de microorganismos.',
          items:[
            {t:'Piel', d:'Barrera que cubre el cuerpo e impide la entrada de microbios.', e:'🧍'},
            {t:'Mucosa', d:'Capa húmeda (nariz, boca) que atrapa microorganismos.', e:'👃'},
            {t:'Saliva', d:'Líquido de la boca que ayuda a eliminar microbios.', e:'💧'},
            {t:'Glóbulos blancos', d:'Células de la sangre que defienden al cuerpo.', e:'⚪'},
            {t:'Fiebre', d:'Aumento de temperatura que ayuda a combatir infecciones.', e:'🌡️'},
            {t:'Higiene', d:'Hábitos de limpieza que previenen enfermedades.', e:'🧼'},
          ],
          datos:['Estornudar tapándote con el codo evita contagiar a otros.','Dormir bien y comer sano fortalecen tus defensas.'] },
        { id:'materia', nombre:'La materia y sus propiedades', emoji:'⚗️',
          oa:'Reconocer propiedades de la materia (masa, volumen, estados)',
          intro:'Todo lo que ocupa espacio y tiene masa es materia.',
          items:[
            {t:'Materia', d:'Todo lo que tiene masa y ocupa un lugar en el espacio.', e:'🧊'},
            {t:'Masa', d:'Cantidad de materia que tiene un objeto; se mide en gramos.', e:'⚖️'},
            {t:'Volumen', d:'Espacio que ocupa un objeto.', e:'📦'},
            {t:'Sólido', d:'Estado con forma y volumen fijos (ej: hielo).', e:'🧊'},
            {t:'Líquido', d:'Estado que fluye y toma la forma del recipiente (ej: agua).', e:'💧'},
            {t:'Gaseoso', d:'Estado que ocupa todo el espacio disponible (ej: vapor).', e:'💨'},
          ],
          datos:['El agua puede ser sólida (hielo), líquida o gaseosa (vapor).','La masa se mide con una balanza; el volumen, con una probeta.'] },
        { id:'mezclas', nombre:'Mezclas y separación', emoji:'🧪',
          oa:'Identificar mezclas y métodos para separarlas',
          intro:'Una mezcla se forma al juntar dos o más materiales.',
          items:[
            {t:'Mezcla', d:'Unión de dos o más materiales que no se transforman.', e:'🥣'},
            {t:'Mezcla homogénea', d:'No se distinguen sus partes (ej: agua con sal).', e:'🧂'},
            {t:'Mezcla heterogénea', d:'Se distinguen sus partes (ej: ensalada).', e:'🥗'},
            {t:'Filtración', d:'Separar un sólido de un líquido con un filtro.', e:'☕'},
            {t:'Evaporación', d:'Separar por calor: el líquido se va y queda el sólido.', e:'♨️'},
            {t:'Tamizado', d:'Separar sólidos de distinto tamaño con una malla.', e:'🕸️'},
          ],
          datos:['El agua con arena se separa por filtración.','El agua con sal se separa por evaporación.'] },
        { id:'agua', nombre:'El agua en la Tierra', emoji:'💧',
          oa:'Describir la distribución del agua y su ciclo',
          intro:'La mayor parte del agua de la Tierra está en los océanos.',
          items:[
            {t:'Ciclo del agua', d:'Recorrido del agua entre la Tierra, el cielo y de vuelta.', e:'🔁'},
            {t:'Evaporación', d:'El agua se calienta y sube como vapor.', e:'☀️'},
            {t:'Condensación', d:'El vapor se enfría y forma las nubes.', e:'☁️'},
            {t:'Precipitación', d:'El agua cae como lluvia, nieve o granizo.', e:'🌧️'},
            {t:'Agua dulce', d:'Agua sin sal, de ríos, lagos y glaciares.', e:'🏞️'},
            {t:'Agua salada', d:'Agua de los océanos y mares.', e:'🌊'},
          ],
          datos:['Casi toda el agua del planeta es salada; muy poca es dulce.','Cuidar el agua es tarea de todos: ciérrala mientras te cepillas.'] },
      ]
    }
  }
};
