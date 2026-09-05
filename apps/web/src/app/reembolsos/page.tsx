import Link from "next/link";
import { LEGAL_ENTITY_NAME, LEGAL_CUIT, SUPPORT_EMAIL, LEGAL_LAST_UPDATED } from "@/lib/legal-info";

export default function ReembolsosPage() {
  return (
    <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 56 }}>
      <h1>Política de Reembolsos y Cancelaciones</h1>
      <p style={{ color: "#55504a" }}>Última actualización: {LEGAL_LAST_UPDATED}</p>

      <p>Esta Política regula los reembolsos, cancelaciones y solicitudes de arrepentimiento relacionadas con operaciones realizadas mediante <strong>Copita</strong>.</p>
      <p>
        Es operada por <strong>{LEGAL_ENTITY_NAME}</strong>, CUIT <strong>{LEGAL_CUIT}</strong>, República Argentina.
      </p>

      <h2>1. Pagos únicos</h2>
      <p>Una copita es un aporte realizado voluntariamente por un Aportante a un Creador mediante la Plataforma.</p>
      <p>Los pagos son procesados por Mercado Pago.</p>
      <p>Cuando corresponda efectuar un reembolso, la devolución se realizará tomando como referencia el <strong>importe efectivamente cobrado en pesos argentinos (ARS)</strong>.</p>
      <p>No se recalculará el aporte utilizando el valor actual del dólar ni una cotización distinta de la utilizada en la operación original.</p>

      <h2>2. Derecho de arrepentimiento</h2>
      <p>Cuando resulte aplicable la normativa argentina de defensa del consumidor, el usuario podrá ejercer el derecho de arrepentimiento dentro de los <strong>10 días corridos</strong> previstos legalmente para las contrataciones a distancia.</p>
      <p>
        Copita dispondrá de un mecanismo de acceso visible denominado &ldquo;<Link href="/arrepentimiento">Botón de arrepentimiento</Link>&rdquo;.
      </p>
      <p>El usuario no deberá iniciar sesión ni completar una registración adicional para comenzar el trámite.</p>
      <p>Por razones de seguridad, Copita podrá solicitar únicamente la información razonablemente necesaria para verificar la identidad del solicitante y localizar la transacción.</p>
      <p>Cuando se trate de una copita de apoyo que no incluya una prestación o beneficio que haya sido efectivamente utilizado o consumido, la solicitud válida de arrepentimiento dentro del plazo aplicable dará lugar al reembolso total de la operación.</p>
      <p>Las excepciones establecidas por la legislación vigente resultarán aplicables cuando corresponda.</p>

      <h2>3. Cómo solicitar un reembolso</h2>
      <p>
        El usuario podrá utilizar el <Link href="/arrepentimiento">Botón de arrepentimiento</Link> cuando corresponda legalmente o contactar a{" "}
        <strong>{SUPPORT_EMAIL}</strong>.
      </p>
      <p>Para identificar la operación podremos solicitar:</p>
      <ul>
        <li>correo utilizado en el pago;</li>
        <li>identificador de pago o comprobante;</li>
        <li>fecha aproximada;</li>
        <li>importe;</li>
        <li>y Creador destinatario.</li>
      </ul>
      <p>No se solicitarán datos completos de la tarjeta.</p>

      <h2>4. Suscripciones mensuales</h2>
      <p>Las suscripciones del Club de Copita generan cargos recurrentes mientras permanezcan activas.</p>
      <p>El usuario puede solicitar la <strong>cancelación en cualquier momento</strong> para impedir futuros cobros.</p>
      <p>La cancelación de una suscripción no genera automáticamente la devolución de cargos anteriores.</p>
      <p>Si el usuario pretende además la devolución de un cargo ya efectuado, deberá solicitarlo conforme a esta Política.</p>
      <p>Los derechos de arrepentimiento o reembolso establecidos por normas de orden público no se ven afectados por la cancelación.</p>

      <h2>5. Utilización de beneficios o servicios</h2>
      <p>Cuando una suscripción o pago incluya acceso a contenido, servicios u otros beneficios y éstos hayan sido efectivamente utilizados o consumidos, podrán resultar aplicables las excepciones al derecho de arrepentimiento previstas por la legislación argentina.</p>
      <p>Esto no limita los derechos que pudieran corresponder al usuario cuando exista incumplimiento, una prestación defectuosa, un cobro incorrecto u otra causa legal de devolución.</p>

      <h2>6. Cobros duplicados o incorrectos</h2>
      <p>Si se detecta un cobro duplicado, un importe diferente al informado al confirmar la operación o un error atribuible a Copita, el usuario podrá solicitar su revisión y, si se confirma el error, se gestionará la devolución correspondiente.</p>

      <h2>7. Operaciones no reconocidas</h2>
      <p>Si un usuario considera que una operación fue realizada sin su autorización, deberá comunicarlo a Copita y también podrá utilizar los mecanismos de desconocimiento y protección disponibles en Mercado Pago o ante la entidad emisora de su medio de pago.</p>
      <p>Copita podrá colaborar aportando la información técnica disponible y podrá suspender temporalmente cuentas u operaciones cuando resulte necesario para investigar posible fraude.</p>

      <h2>8. Forma de devolución</h2>
      <p>Los reembolsos se procesarán mediante Mercado Pago siempre que técnicamente corresponda.</p>
      <p>Dependiendo del medio de pago utilizado, el dinero podrá regresar a la cuenta de Mercado Pago del Aportante, reflejarse en el resumen de una tarjeta o ser acreditado utilizando el mecanismo definido por Mercado Pago y la entidad financiera correspondiente.</p>
      <p>El plazo en el que el importe se vea reflejado puede depender de Mercado Pago, del banco, del emisor de la tarjeta y del medio de pago utilizado.</p>
      <p>Copita no puede acelerar los plazos internos de acreditación de terceros una vez que un reembolso fue correctamente procesado.</p>

      <h2>9. Pagos procesados mediante marketplace</h2>
      <p>En determinados aportes, Mercado Pago distribuye automáticamente el pago entre la cuenta del Creador y la comisión correspondiente a Copita.</p>
      <p>Cuando una de esas operaciones sea reembolsada, el sistema de pagos podrá realizar los ajustes correspondientes sobre las partes de la operación.</p>
      <p>Las limitaciones técnicas o de disponibilidad de saldo de las cuentas involucradas no extinguen los derechos que correspondan al usuario conforme a normas de orden público.</p>

      <h2>10. Contracargos y reversión</h2>
      <p>Si Mercado Pago, una entidad financiera o el emisor de una tarjeta revierte una operación mediante contracargo, desconocimiento u otro procedimiento, Copita podrá actualizar el estado de la operación y revertir las comisiones relacionadas.</p>
      <p>No corresponde obtener simultáneamente un reembolso y un contracargo por el mismo importe.</p>

      <h2>11. Botón de baja de servicio</h2>
      <p>
        Copita ofrecerá un mecanismo digital denominado &ldquo;<Link href="/baja">Botón de baja de servicio</Link>&rdquo; para las suscripciones o
        servicios recurrentes alcanzados por la normativa aplicable.
      </p>
      <p>No será necesario iniciar sesión para comenzar el trámite.</p>
      <p>Copita podrá aplicar mecanismos razonables destinados exclusivamente a verificar la identidad del solicitante y evitar cancelaciones realizadas por terceros no autorizados.</p>
      <p>La baja impedirá nuevos cobros una vez procesada, sin perjuicio de los cargos correctamente generados con anterioridad.</p>

      <h2>12. Derechos del consumidor</h2>
      <p>Nada de lo establecido en esta Política limita ni reemplaza los derechos irrenunciables que correspondan conforme a la Ley 24.240, el Código Civil y Comercial de la Nación y demás normativa aplicable.</p>
      <p>Si una disposición de esta Política resultara menos favorable que una norma de orden público aplicable, prevalecerá dicha norma.</p>

      <h2>13. Contacto</h2>
      <p>Para consultas sobre pagos, devoluciones o cancelaciones:</p>
      <p>
        <strong>{LEGAL_ENTITY_NAME}</strong>
        <br />
        CUIT: <strong>{LEGAL_CUIT}</strong>
        <br />
        Correo: <strong>{SUPPORT_EMAIL}</strong>
      </p>
    </div>
  );
}
