SELECT
  (vote.value ->> 'projectId' :: text) AS project_id,
  count(*) AS count
FROM
  ballots,
  LATERAL jsonb_array_elements(ballots.votes) vote(value)
GROUP BY
  (vote.value ->> 'projectId' :: text)
ORDER BY
  (count(*)) DESC;