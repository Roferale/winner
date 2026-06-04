"use client";

export default function Error({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="error-screen">
      <div className="error-card">
        <div className="eyebrow">Falha de interface</div>
        <h2>Não foi possível carregar este módulo do ERP</h2>
        <p>
          {process.env.NODE_ENV === "development"
            ? error.message
            : "Ocorreu um erro inesperado ao montar a tela."}
        </p>
        <button className="primary-button" onClick={() => reset()} type="button">
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
