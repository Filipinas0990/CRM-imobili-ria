SELECT
  DATE_TRUNC('month', data) AS mes,
  SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) AS total_entradas,
  SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) AS total_saidas,
  (
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) -
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END)
  ) AS saldo
FROM financeiro
WHERE status = 'confirmado'
GROUP BY mes
ORDER BY mes ASC;
