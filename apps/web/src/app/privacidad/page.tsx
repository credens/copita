import { LEGAL_ENTITY_NAME, LEGAL_CUIT, LEGAL_ADDRESS, PRIVACY_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal-info";

export default function PrivacidadPage() {
  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 56 }}>
      <h1>Política de Privacidad</h1>
      <p style={{ color: "#55504a" }}>Última actualización: {LEGAL_LAST_UPDATED}</p>

      <p>Esta Política de Privacidad explica cómo <strong>Copita</strong>, disponible en copita.ar, recopila, utiliza, almacena y comparte datos personales.</p>
      <p>
        El responsable del tratamiento es <strong>{LEGAL_ENTITY_NAME}</strong>, CUIT <strong>{LEGAL_CUIT}</strong>, con domicilio en{" "}
        <strong>{LEGAL_ADDRESS}</strong>, República Argentina.
      </p>
      <p>
        Para consultas sobre privacidad o para ejercer derechos relacionados con datos personales, podés escribir a{" "}
        <strong>{PRIVACY_EMAIL}</strong>.
      </p>

      <h2>1. Alcance</h2>
      <p>Esta Política se aplica a los datos personales tratados cuando una persona:</p>
      <ul>
        <li>visita copita.ar;</li>
        <li>crea una cuenta;</li>
        <li>crea o administra un perfil de Creador;</li>
        <li>realiza una copita;</li>
        <li>se suscribe al Club de un Creador;</li>
        <li>contacta al soporte;</li>
        <li>o interactúa de cualquier otra manera con Copita.</li>
      </ul>

      <h2>2. Datos que podemos recopilar</h2>
      <h3>Datos de cuenta</h3>
      <p>Cuando un Creador se registra podemos recopilar datos como:</p>
      <ul>
        <li>nombre o alias;</li>
        <li>dirección de correo electrónico;</li>
        <li>nombre de usuario;</li>
        <li>credenciales de acceso almacenadas de forma protegida;</li>
        <li>fotografía o avatar;</li>
        <li>biografía;</li>
        <li>etiquetas o categorías;</li>
        <li>configuración del perfil;</li>
        <li>y preferencias relacionadas con la cuenta.</li>
      </ul>

      <h3>Datos relacionados con pagos</h3>
      <p>Los pagos son procesados mediante Mercado Pago.</p>
      <p>Copita puede recibir y almacenar información necesaria para identificar y reconciliar una operación, como:</p>
      <ul>
        <li>identificador de pago;</li>
        <li>importe;</li>
        <li>moneda;</li>
        <li>fecha;</li>
        <li>estado de la transacción;</li>
        <li>identificador del Creador;</li>
        <li>información técnica proporcionada por Mercado Pago;</li>
        <li>estado de una suscripción;</li>
        <li>e información limitada del pagador cuando resulte necesaria para operar la Plataforma.</li>
      </ul>
      <p>Copita no necesita almacenar los datos completos de las tarjetas utilizadas para realizar pagos mediante Checkout Pro de Mercado Pago.</p>
      <p>La información sensible necesaria para autorizar el pago es gestionada por el proveedor de pagos conforme a sus propias políticas y condiciones.</p>

      <h3>Datos de integración de Creadores</h3>
      <p>Cuando un Creador conecta Mercado Pago, Copita puede tratar identificadores y credenciales técnicas necesarias para mantener esa integración.</p>
      <p>Las credenciales de acceso que deban almacenarse son protegidas mediante mecanismos de seguridad y cifrado.</p>

      <h3>Información de aportes</h3>
      <p>Cuando la funcionalidad correspondiente esté disponible, podemos recopilar:</p>
      <ul>
        <li>nombre o alias del Aportante;</li>
        <li>mensaje enviado al Creador;</li>
        <li>importe aportado;</li>
        <li>Creador destinatario;</li>
        <li>y fecha del aporte.</li>
      </ul>
      <p>Si el usuario decide publicar un nombre, alias o mensaje en el muro público de un Creador, dicha información será accesible públicamente.</p>

      <h3>Información técnica</h3>
      <p>Podemos recopilar automáticamente datos técnicos necesarios para seguridad y funcionamiento, como:</p>
      <ul>
        <li>dirección IP;</li>
        <li>tipo de navegador;</li>
        <li>sistema operativo;</li>
        <li>fecha y hora de acceso;</li>
        <li>registros de errores;</li>
        <li>actividad de sesión;</li>
        <li>y eventos relacionados con seguridad.</li>
      </ul>

      <h2>3. Para qué utilizamos los datos</h2>
      <p>Los datos personales pueden utilizarse para:</p>
      <ul>
        <li>crear y administrar cuentas;</li>
        <li>mostrar perfiles públicos;</li>
        <li>procesar y registrar aportes y suscripciones;</li>
        <li>conectar cuentas de Mercado Pago;</li>
        <li>gestionar comisiones;</li>
        <li>confirmar el estado de operaciones;</li>
        <li>prevenir fraude y accesos no autorizados;</li>
        <li>atender consultas y reclamos;</li>
        <li>gestionar cancelaciones y reembolsos;</li>
        <li>cumplir obligaciones legales;</li>
        <li>mantener registros contables y operativos;</li>
        <li>proteger la seguridad de Copita y sus usuarios;</li>
        <li>resolver errores técnicos;</li>
        <li>y mejorar el funcionamiento de la Plataforma.</li>
      </ul>
      <p>No utilizaremos datos personales para finalidades incompatibles con aquellas para las que fueron recopilados sin informar previamente al titular cuando corresponda.</p>

      <h2>4. Consentimiento y tratamiento de los datos</h2>
      <p>Cuando la legislación requiera consentimiento, Copita solicitará que sea libre, expreso e informado.</p>
      <p>Determinados tratamientos también resultan necesarios para ejecutar los servicios solicitados por el usuario, proteger la seguridad de la Plataforma o cumplir obligaciones legales.</p>
      <p>El suministro de ciertos datos puede ser obligatorio para crear una cuenta, recibir pagos o utilizar funciones específicas. Si esos datos no son suministrados, puede que no sea posible prestar el servicio solicitado.</p>

      <h2>5. Mercado Pago</h2>
      <p>Copita utiliza servicios de Mercado Pago para procesar pagos y suscripciones.</p>
      <p>Mercado Pago es un tercero independiente y trata determinados datos conforme a sus propios términos y políticas de privacidad.</p>
      <p>Cuando el usuario accede al entorno de Mercado Pago o proporciona allí información de pago, ese tratamiento se encuentra también sujeto a las condiciones de Mercado Pago.</p>
      <p>Copita puede intercambiar con Mercado Pago la información estrictamente necesaria para crear operaciones, verificar su resultado, gestionar suscripciones, prevenir fraude, realizar reembolsos y conciliar transacciones.</p>

      <h2>6. Otros proveedores</h2>
      <p>Copita puede utilizar proveedores de infraestructura, alojamiento, bases de datos, seguridad, almacenamiento, correo electrónico, monitoreo o soporte técnico.</p>
      <p>Estos proveedores podrán acceder únicamente a la información necesaria para prestar sus servicios y deberán tratarla conforme a las instrucciones y obligaciones contractuales aplicables.</p>

      <h2>7. Transferencias internacionales</h2>
      <p>Algunos proveedores tecnológicos pueden procesar o almacenar información fuera de la República Argentina.</p>
      <p>Cuando corresponda realizar transferencias internacionales de datos personales, Copita adoptará las medidas exigidas por la Ley 25.326 y su normativa complementaria para procurar un nivel adecuado de protección de los datos.</p>

      <h2>8. Información compartida con Creadores</h2>
      <p>Cuando una persona realiza un aporte, el Creador destinatario puede recibir información relacionada con esa operación en la medida necesaria para identificar y administrar el aporte.</p>
      <p>No se proporcionarán al Creador datos completos de tarjetas u otras credenciales financieras utilizadas para realizar el pago.</p>
      <p>Si el Aportante decide hacer público su nombre, alias o mensaje, esos datos podrán mostrarse en el perfil público del Creador.</p>

      <h2>9. Autoridades y obligaciones legales</h2>
      <p>Copita podrá conservar o comunicar información cuando exista una obligación legal, orden judicial, requerimiento válido de una autoridad competente o cuando resulte razonablemente necesario para investigar fraude, proteger derechos o garantizar la seguridad de la Plataforma.</p>

      <h2>10. Conservación de datos</h2>
      <p>Los datos se conservarán durante el tiempo necesario para cumplir las finalidades para las que fueron obtenidos.</p>
      <p>Determinados registros podrán conservarse durante períodos adicionales cuando resulten necesarios para cumplir obligaciones legales, fiscales, contables, de prevención del fraude, ejercicio de derechos o resolución de controversias.</p>
      <p>Cuando los datos dejen de ser necesarios y no exista obligación de conservarlos, serán eliminados, anonimizados o archivados de forma adecuada.</p>

      <h2>11. Seguridad</h2>
      <p>Copita adopta medidas técnicas y organizativas razonables para proteger los datos personales contra accesos no autorizados, pérdida, alteración, divulgación o destrucción.</p>
      <p>Entre otras medidas, pueden utilizarse cifrado, controles de acceso, mecanismos de autenticación, registros de seguridad y protección de credenciales.</p>
      <p>Ningún sistema informático puede garantizar seguridad absoluta. Ante un incidente de seguridad relevante, Copita adoptará las medidas correspondientes de acuerdo con la naturaleza del incidente y las obligaciones legales aplicables.</p>

      <h2>12. Cookies</h2>
      <p>Copita utiliza cookies o tecnologías equivalentes estrictamente necesarias para funciones como autenticación, mantenimiento de sesión, seguridad y funcionamiento del Sitio.</p>
      <p>Estas tecnologías son necesarias para prestar las funcionalidades solicitadas por el usuario.</p>
      <p>Si en el futuro Copita incorpora herramientas de analítica, publicidad o seguimiento que requieran consentimiento o información adicional, esta Política y los mecanismos de consentimiento serán actualizados antes de utilizarlas cuando corresponda.</p>

      <h2>13. Menores de edad</h2>
      <p>Copita no está dirigida a menores de 18 años para la creación de cuentas, recepción de fondos o celebración de contratos.</p>
      <p>Si se detecta que se recopilaron indebidamente datos de un menor, podrán ser eliminados de acuerdo con la legislación aplicable.</p>

      <h2>14. Derechos sobre los datos personales</h2>
      <p>Conforme a la Ley 25.326, el titular de los datos puede solicitar información y ejercer sus derechos de acceso, actualización, rectificación y, cuando corresponda, supresión.</p>
      <p>El derecho de acceso puede ejercerse gratuitamente en los intervalos establecidos por la normativa aplicable.</p>
      <p>Los pedidos de acceso serán respondidos dentro de los plazos legales correspondientes. Los pedidos válidos de rectificación, actualización o supresión serán gestionados dentro de los plazos previstos por la Ley 25.326.</p>
      <p>
        Para ejercer estos derechos, el titular deberá contactar a: <strong>{PRIVACY_EMAIL}</strong>
      </p>
      <p>Copita podrá solicitar información razonable exclusivamente para verificar la identidad de la persona que realiza el pedido.</p>
      <p>La supresión puede no resultar procedente respecto de información que Copita tenga obligación legal de conservar o cuya conservación resulte necesaria para proteger derechos legítimos de terceros.</p>

      <h2>15. Autoridad de control</h2>
      <p>
        La <strong>Agencia de Acceso a la Información Pública (AAIP)</strong> es la autoridad de aplicación de la Ley 25.326 y recibe denuncias y
        reclamos relacionados con el incumplimiento de las normas de protección de datos personales.
      </p>

      <h2>16. Modificaciones</h2>
      <p>Copita podrá actualizar esta Política para reflejar cambios legales, tecnológicos o en las funcionalidades de la Plataforma.</p>
      <p>La versión vigente estará disponible en copita.ar y mostrará la fecha de su última actualización.</p>
      <p>Cuando un cambio resulte sustancial, se adoptarán medidas razonables para informarlo a los usuarios afectados.</p>

      <h2>17. Responsable y contacto</h2>
      <p>
        <strong>Responsable:</strong> {LEGAL_ENTITY_NAME}
        <br />
        <strong>CUIT:</strong> {LEGAL_CUIT}
        <br />
        <strong>Domicilio:</strong> {LEGAL_ADDRESS}
        <br />
        <strong>Correo de privacidad:</strong> {PRIVACY_EMAIL}
      </p>
    </div>
  );
}
