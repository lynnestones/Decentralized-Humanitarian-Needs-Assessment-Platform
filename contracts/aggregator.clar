(define-data-var contract-owner principal tx-sender)

(define-map authorized-contributors { contributor: principal } bool)
(define-map regions { region: (string-ascii 50) } bool)
(define-map categories { category: (string-ascii 50) } bool)

(define-map pending-contributions 
  { region: (string-ascii 50), category: (string-ascii 50), period: uint, contributor: principal }
  { amount: uint, weight: uint, timestamp: uint })

(define-map aggregated-data 
  { region: (string-ascii 50), category: (string-ascii 50), period: uint }
  { total-weight: uint,
    count: uint,
    max-value: uint,
    min-value: uint,
    last-update: uint,
    agg-type: uint })

(define-private (validate-region (region (string-ascii 50)))
  (if (is-some (map-get? regions { region: region }))
      (ok true)
      (err u100)))

(define-private (validate-category (category (string-ascii 50)))
  (if (is-some (map-get? categories { category: category }))
      (ok true)
      (err u101)))

(define-private (validate-amount (amount uint))
  (if (> amount u0)
      (ok true)
      (err u102)))

(define-private (validate-weight (weight uint))
  (if (> weight u0)
      (ok true)
      (err u103)))

(define-private (validate-period (period uint))
  (if (> period u0)
      (ok true)
      (err u104)))

(define-private (validate-agg-type (agg-type uint))
  (if (or (is-eq agg-type u1) (is-eq agg-type u2))
      (ok true)
      (err u105)))

(define-private (validate-query-range (start uint) (end uint))
  (if (<= start end)
      (ok true)
      (err u106)))

(define-public (add-authorized-contributor (contributor principal))
  (begin
    (map-set authorized-contributors { contributor: contributor } true)
    (ok true)))

(define-public (remove-authorized-contributor (contributor principal))
  (begin
    (map-delete authorized-contributors { contributor: contributor })
    (ok true)))

(define-public (add-region (region (string-ascii 50)))
  (begin
    (map-set regions { region: region } true)
    (ok true)))

(define-public (add-category (category (string-ascii 50)))
  (begin
    (map-set categories { category: category } true)
    (ok true)))

(define-public (submit-contribution (region (string-ascii 50)) (category (string-ascii 50)) (amount uint) (weight uint) (period uint))
  (begin
    (try! (validate-region region))
    (try! (validate-category category))
    (try! (validate-amount amount))
    (try! (validate-weight weight))
    (let ((timestamp block-height))
      (map-set pending-contributions 
        { region: region, category: category, period: period, contributor: tx-sender }
        { amount: amount, weight: weight, timestamp: timestamp })
      (ok true))))

(define-public (aggregate (region (string-ascii 50)) (category (string-ascii 50)) (period uint) (agg-type uint))
  (begin
    (try! (validate-region region))
    (try! (validate-category category))
    (try! (validate-period period))
    (try! (validate-agg-type agg-type))
    (let ((agg { total-weight: u0,
                 count: u0,
                 max-value: u0,
                 min-value: u18446744073709551615,
                 last-update: block-height,
                 agg-type: agg-type }))
      (map-set aggregated-data { region: region, category: category, period: period } agg)
      (ok agg))))

(define-private (range-helper (region (string-ascii 50)) (category (string-ascii 50)) (start uint) (end uint))
  (begin
    (try! (validate-query-range start end))
    (ok { total-weight: u0,
          count: u0,
          max-value: u0,
          min-value: u18446744073709551615,
          last-update: block-height,
          agg-type: u1 })))

(define-private (range (region (string-ascii 50)) (category (string-ascii 50)) (start uint) (end uint))
  (range-helper region category start end))

(define-private (compute-historical-average (region (string-ascii 50)) (category (string-ascii 50)) (start uint) (end uint))
  (range-helper region category start end))

(define-public (query-range (region (string-ascii 50)) (category (string-ascii 50)) (start-period uint) (end-period uint))
  (begin
    (try! (validate-region region))
    (try! (validate-category category))
    (try! (validate-query-range start-period end-period))
    (range region category start-period end-period)))

(define-public (transfer-ownership (new-owner principal))
  (begin
    (var-set contract-owner new-owner)
    (ok true)))
