;; Copyright (c) 2013 The Finnish National Board of Education - Opetushallitus
;;
;; This program is free software:  Licensed under the EUPL, Version 1.1 or - as
;; soon as they will be approved by the European Commission - subsequent versions
;; of the EUPL (the "Licence");
;;
;; You may not use this work except in compliance with the Licence.
;; You may obtain a copy of the Licence at: http://www.osor.eu/eupl/
;;
;; This program is distributed in the hope that it will be useful,
;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
;; European Union Public Licence for more details.

(ns aipal.infra.eraajo.kayttajat
  (:require [clojurewerkz.quartzite.conversion :as qc]
            [clojure.tools.logging :as log]
            [oph.korma.korma-auth :refer [integraatiokayttaja]]
            [aipal.arkisto.kayttajaoikeus :as kayttajaoikeus-arkisto]
            [aipal.arkisto.koulutustoimija :as koulutustoimija-arkisto]
            [aipal.integraatio.kayttooikeuspalvelu :as kop]
            [aipal.toimiala.kayttajaroolit :refer [ldap-roolit]]
            [oph.common.util.util :refer [map-by]]
            [aipal.infra.kayttaja :refer [*kayttaja*]]))

(defn paivita-kayttajat-ldapista [kayttooikeuspalvelu]
  (binding [;; Poolista ei saa yhteyttä ilman että *kayttaja* on sidottu.
            *kayttaja* {:uid integraatiokayttaja
                        :oid integraatiokayttaja}]
    (let [oid->ytunnus (map-by :oid (koulutustoimija-arkisto/hae-kaikki-joissa-oid))]
      (log/info "Päivitetään käyttäjät ja käyttäjien roolit käyttöoikeuspalvelun LDAP:sta")
      (kayttajaoikeus-arkisto/paivita-kaikki!
        (mapcat #(kop/kayttajat kayttooikeuspalvelu % oid->ytunnus) (vals ldap-roolit))))))

;; Cloverage ei tykkää `defrecord`eja generoivista makroista, joten hoidetaan
;; `defjob`:n homma käsin.
(defrecord PaivitaKayttajatLdapistaJob []
   org.quartz.Job
   (execute [this ctx]
     (let [{kop "kayttooikeuspalvelu"} (qc/from-job-data ctx)]
       (paivita-kayttajat-ldapista kop))))
