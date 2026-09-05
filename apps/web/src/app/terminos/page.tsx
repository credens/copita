import { LEGAL_ENTITY_NAME, LEGAL_CUIT, LEGAL_ADDRESS, SUPPORT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal-info";

export default function TerminosPage() {
  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 56 }}>
      <h1>Términos y Condiciones</h1>
      <p style={{ color: "#55504a" }}>Última actualización: {LEGAL_LAST_UPDATED}</p>

      <p>
        Estos Términos y Condiciones regulan el acceso y uso de <strong>Copita</strong>, disponible en <strong>copita.ar</strong> (en adelante,
        &ldquo;Copita&rdquo;, la &ldquo;Plataforma&rdquo; o el &ldquo;Sitio&rdquo;).
      </p>
      <p>
        Copita es operada por <strong>{LEGAL_ENTITY_NAME}</strong>, CUIT <strong>{LEGAL_CUIT}</strong>, con domicilio en{" "}
        <strong>{LEGAL_ADDRESS}</strong>, República Argentina (en adelante, el &ldquo;Operador&rdquo;).
      </p>
      <p>Al acceder, registrarte o utilizar Copita aceptás estos Términos y Condiciones. Si no estás de acuerdo con ellos, no debés utilizar la Plataforma.</p>

      <h2>1. Qué es Copita</h2>
      <p>
        Copita es una plataforma tecnológica que permite a creadores de contenido, artistas, profesionales y otros usuarios
        (&ldquo;Creadores&rdquo;) recibir aportes económicos de personas que desean apoyarlos (&ldquo;Aportantes&rdquo;).
      </p>
      <p>Los aportes pueden realizarse mediante:</p>
      <ul>
        <li>pagos únicos, denominados &ldquo;copitas&rdquo;; y</li>
        <li>pagos recurrentes mensuales mediante funcionalidades de suscripción o &ldquo;Club de Copita&rdquo;, cuando se encuentren habilitadas.</li>
      </ul>
      <p>Copita brinda la infraestructura tecnológica para conectar a Creadores y Aportantes y facilitar el procesamiento de pagos mediante proveedores externos.</p>
      <p>Copita no es un banco, entidad financiera, proveedor de servicios de pago ni una organización benéfica.</p>

      <h2>2. Usuarios</h2>
      <p>Pueden utilizar Copita personas mayores de 18 años con capacidad legal suficiente para contratar.</p>
      <p>Existen principalmente dos tipos de usuarios:</p>
      <p>
        <strong>Aportante:</strong> persona que realiza uno o más aportes a un Creador.
      </p>
      <p>
        <strong>Creador:</strong> persona humana o jurídica que crea un perfil en Copita y conecta una cuenta de Mercado Pago para recibir aportes.
      </p>
      <p>Una misma persona puede actuar como Aportante y como Creador.</p>

      <h2>3. Registro de Creadores</h2>
      <p>Para publicar un perfil y recibir pagos, el Creador deberá crear una cuenta y proporcionar información verdadera, completa y actualizada.</p>
      <p>El Creador es responsable de mantener la confidencialidad de sus credenciales y de toda actividad realizada desde su cuenta.</p>
      <p>Copita podrá requerir verificaciones adicionales cuando resulten razonablemente necesarias para prevenir fraude, cumplir obligaciones legales o proteger la seguridad de la Plataforma.</p>
      <p>Para recibir pagos, el Creador deberá conectar una cuenta válida de Mercado Pago y cumplir los requisitos de identificación, validación y operación exigidos por dicho proveedor.</p>
      <p>La conexión técnica de una cuenta no implica que Mercado Pago haya aprobado definitivamente al usuario para realizar o recibir todas las operaciones disponibles.</p>

      <h2>4. Perfil público del Creador</h2>
      <p>El Creador podrá publicar, entre otros datos, nombre o alias, fotografía, descripción, etiquetas, enlaces, publicaciones, precios de referencia y otra información relacionada con su actividad.</p>
      <p>El Creador garantiza que tiene derecho a utilizar y publicar todo el contenido que incorpore en Copita.</p>
      <p>La información destinada al perfil público podrá ser visualizada por cualquier visitante del Sitio.</p>
      <p>Copita podrá retirar o limitar contenido que infrinja estos Términos, derechos de terceros, legislación aplicable o políticas de los proveedores de pago.</p>

      <h2>5. Aportes únicos</h2>
      <p>Cada Creador puede definir un valor de referencia para cada copita.</p>
      <p>
        Cuando el valor se encuentre expresado utilizando una referencia en dólares estadounidenses (USD), el importe final será convertido y
        cobrado en <strong>pesos argentinos (ARS)</strong> utilizando la cotización aplicable informada por Copita al momento de generar el pago.
      </p>
      <p>El importe en pesos que se muestra antes de confirmar la operación es el importe aplicable a esa transacción.</p>
      <p>Las variaciones posteriores del tipo de cambio no modifican una operación ya realizada.</p>
      <p>El pago se procesa mediante Mercado Pago. El Aportante deberá aceptar también las condiciones aplicables de Mercado Pago.</p>

      <h2>6. Comisión de Copita</h2>
      <p>Por los servicios prestados al Creador, Copita aplica una comisión estándar equivalente al <strong>5% del aporte</strong>, salvo que en el panel del Creador se informe expresamente una condición distinta acordada con él.</p>
      <p>En los pagos únicos compatibles con el sistema marketplace, la comisión de Copita puede separarse automáticamente durante el procesamiento del pago.</p>
      <p>Mercado Pago puede aplicar sus propias comisiones, cargos, retenciones o condiciones conforme a la cuenta y situación particular del Creador. Dichos cargos son independientes de la comisión de Copita.</p>
      <p>Copita podrá modificar sus comisiones para operaciones futuras. Cualquier cambio relevante será informado antes de que resulte aplicable al Creador.</p>

      <h2>7. Suscripciones y Club de Copita</h2>
      <p>Cuando un Creador habilite el Club de Copita, un Aportante podrá autorizar pagos recurrentes mensuales.</p>
      <p>Antes de suscribirse se mostrará el importe y la periodicidad aplicables.</p>
      <p>La suscripción permanecerá activa hasta que sea cancelada por el Aportante, el Creador, Mercado Pago o Copita conforme a estos Términos.</p>
      <p>La cancelación detiene los cobros futuros y no implica automáticamente la devolución de pagos ya procesados. Los pedidos de devolución se rigen por la Política de Reembolsos y por los derechos que correspondan conforme a la legislación aplicable.</p>
      <p>Cuando el Creador ofrezca beneficios, contenido exclusivo u otras prestaciones vinculadas a una suscripción, deberá informar claramente sus características y condiciones.</p>
      <p>Salvo indicación expresa de Copita, la responsabilidad por el contenido o beneficio ofrecido corresponde al Creador que lo publica.</p>

      <h2>8. Cancelación de una suscripción</h2>
      <p>El Aportante podrá solicitar la cancelación de una suscripción activa para evitar futuros cobros.</p>
      <p>Copita mantendrá mecanismos digitales adecuados para solicitar la baja.</p>
      <p>La baja podrá requerir únicamente mecanismos razonables de verificación de identidad y seguridad.</p>

      <h2>9. Mensajes y datos del Aportante</h2>
      <p>Cuando la funcionalidad esté habilitada, el Aportante podrá enviar su nombre, alias o un mensaje junto con una copita.</p>
      <p>Antes de publicarlo se indicará si esa información será visible públicamente.</p>
      <p>El Aportante no podrá utilizar estos campos para publicar contenido ilegal, amenazante, discriminatorio, fraudulento, difamatorio, sexualmente ilícito, datos personales de terceros sin autorización, spam o contenido que infrinja derechos de terceros.</p>
      <p>Copita podrá moderar o eliminar ese contenido.</p>

      <h2>10. Obligaciones de los Creadores</h2>
      <p>Cada Creador es responsable de:</p>
      <ul>
        <li>mantener actualizada la información de su perfil;</li>
        <li>cumplir las condiciones de Mercado Pago;</li>
        <li>cumplir sus obligaciones fiscales, tributarias, contables y de facturación;</li>
        <li>informar de manera clara cualquier contraprestación o beneficio ofrecido;</li>
        <li>cumplir los compromisos asumidos frente a sus Aportantes;</li>
        <li>tener los derechos necesarios sobre el contenido que publica;</li>
        <li>y no utilizar Copita para actividades ilegales, fraudulentas o prohibidas.</li>
      </ul>
      <p>Copita no presta asesoramiento fiscal, contable o jurídico al Creador.</p>

      <h2>11. Actividades prohibidas</h2>
      <p>No podrá utilizarse Copita para fraude, lavado de activos, financiación de actividades ilícitas, suplantación de identidad, venta o promoción de bienes o servicios ilegales, explotación de menores, infracción de propiedad intelectual, evasión de controles de proveedores de pago ni cualquier otra actividad contraria a la legislación aplicable.</p>
      <p>También se prohíbe interferir con la seguridad o funcionamiento de la Plataforma, intentar acceder sin autorización a cuentas o sistemas, automatizar abusivamente solicitudes o utilizar Copita para distribuir software malicioso.</p>
      <p>Copita podrá bloquear operaciones o suspender cuentas cuando existan indicios razonables de incumplimiento.</p>

      <h2>12. Impuestos y facturación</h2>
      <p>Cada Creador es responsable de determinar las obligaciones fiscales derivadas de los importes que recibe mediante Copita.</p>
      <p>Copita es responsable exclusivamente de las obligaciones fiscales correspondientes a los ingresos y comisiones propios de la Plataforma.</p>
      <p>La utilización de Copita no reemplaza el asesoramiento de un contador o profesional tributario.</p>

      <h2>13. Reembolsos, desconocimientos y contracargos</h2>
      <p>Los reembolsos se regirán por la <strong>Política de Reembolsos</strong> publicada en el Sitio y por las normas de defensa del consumidor que resulten aplicables.</p>
      <p>Los pagos también pueden ser objeto de investigación, desconocimiento, contracargo, devolución o reversión por parte de Mercado Pago, entidades financieras o emisores de tarjetas.</p>
      <p>Cuando una operación sea revertida, Copita podrá efectuar los ajustes correspondientes sobre comisiones, registros y saldos relacionados con esa transacción.</p>

      <h2>14. Propiedad intelectual</h2>
      <p>La marca Copita, diseño del Sitio, software, logotipos, elementos gráficos y demás contenidos propios de la Plataforma pertenecen al Operador o se utilizan bajo licencia.</p>
      <p>El uso de Copita no otorga al usuario derechos sobre esa propiedad intelectual.</p>
      <p>Cada Creador conserva los derechos sobre el contenido que publica.</p>
      <p>Al publicar contenido en Copita, el Creador concede al Operador una licencia no exclusiva, gratuita y limitada a reproducir, almacenar, adaptar técnicamente y mostrar ese contenido únicamente en la medida necesaria para operar, promocionar y mejorar la Plataforma.</p>
      <p>La licencia finaliza cuando el contenido es eliminado, salvo respecto de copias que deban conservarse por motivos legales, de seguridad o respaldo.</p>

      <h2>15. Disponibilidad de la Plataforma</h2>
      <p>Copita procura mantener el servicio disponible de forma continua, pero no garantiza funcionamiento ininterrumpido.</p>
      <p>Pueden existir interrupciones por mantenimiento, problemas de infraestructura, fallas de terceros, Mercado Pago, servicios de telecomunicaciones, fuerza mayor o circunstancias ajenas al control razonable de Copita.</p>
      <p>Cuando sea posible, se adoptarán medidas razonables para restablecer el servicio.</p>

      <h2>16. Responsabilidad</h2>
      <p>Copita es responsable por las obligaciones que legalmente le correspondan como operadora de la Plataforma.</p>
      <p>Copita no controla ni garantiza la calidad, veracidad, legalidad o cumplimiento de los contenidos o beneficios ofrecidos directamente por cada Creador.</p>
      <p>El Creador responde por sus propias publicaciones, promesas, prestaciones y obligaciones frente a terceros.</p>
      <p>Nada de lo establecido en estos Términos limita derechos irrenunciables de consumidores ni excluye responsabilidades que no puedan ser válidamente excluidas conforme a la legislación argentina.</p>

      <h2>17. Suspensión o cierre de cuentas</h2>
      <p>Copita podrá suspender o cerrar una cuenta cuando exista incumplimiento grave o reiterado de estos Términos, fraude, riesgo para otros usuarios, requerimiento legal, incumplimiento de políticas de proveedores de pago o utilización de la Plataforma para actividades prohibidas.</p>
      <p>Cuando resulte razonablemente posible y no exista un riesgo de seguridad, fraude o prohibición legal, se informará al usuario la medida adoptada.</p>

      <h2>18. Privacidad</h2>
      <p>
        El tratamiento de datos personales se encuentra regulado por la <strong>Política de Privacidad de Copita</strong>, que forma parte de estos
        Términos.
      </p>

      <h2>19. Modificaciones</h2>
      <p>Copita podrá modificar estos Términos para reflejar cambios legales, operativos o funcionales.</p>
      <p>La versión vigente estará siempre publicada en copita.ar indicando su fecha de última actualización.</p>
      <p>Los cambios que afecten sustancialmente una relación contractual vigente serán comunicados con una antelación razonable cuando corresponda.</p>

      <h2>20. Legislación aplicable y resolución de conflictos</h2>
      <p>Estos Términos se rigen por las leyes de la República Argentina.</p>
      <p>Cuando resulte aplicable la normativa de defensa del consumidor, el usuario conserva todos los derechos, vías de reclamo y reglas de jurisdicción establecidos por las normas de orden público.</p>
      <p>Ninguna cláusula de estos Términos podrá interpretarse como renuncia a esos derechos.</p>
      <p>Cuando no exista una relación de consumo y la ley permita pactar jurisdicción, cualquier controversia será sometida a los tribunales ordinarios correspondientes al domicilio del Operador, salvo acuerdo distinto entre las partes.</p>

      <h2>21. Contacto</h2>
      <p>Para consultas, reclamos o cuestiones relacionadas con estos Términos:</p>
      <p>
        <strong>{LEGAL_ENTITY_NAME}</strong>
        <br />
        CUIT: <strong>{LEGAL_CUIT}</strong>
        <br />
        Domicilio: <strong>{LEGAL_ADDRESS}</strong>
        <br />
        Correo electrónico: <strong>{SUPPORT_EMAIL}</strong>
      </p>
    </div>
  );
}
