SELECT
  DATE_TRUNC('month', data) AS mes,

  -- RECEITAS
  SUM(
    CASE 
      WHEN tipo = 'entrada' 
      THEN valor 
      ELSE 0 
    END
  ) AS receitas,

  -- DESPESAS
  SUM(
    CASE 
      WHEN tipo = 'saida' 
      THEN valor 
      ELSE 0 
    END
  ) AS despesas,

  -- RESULTADO OPERACIONAL (LUCRO / PREJUÍZO)
  (
    SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) -
    SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END)
  ) AS resultado

FROM financeiro
WHERE status = 'confirmado'
GROUP BY mes
ORDER BY mes ASC;
