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

(ns aipal.rest-api.kayttaja
  (:require [compojure.core :as c]
            [aipal.arkisto.kayttaja :as arkisto]
            [aipal.arkisto.kayttajaoikeus :as kayttajaoikeus-arkisto]
            [oph.common.util.http-util :refer [json-response]]
            [aipal.toimiala.kayttajaoikeudet :as ko]
            [aipal.compojure-util :as cu]
            [korma.db :as db]
            [aipal.infra.kayttaja :refer [*kayttaja*]]))

(c/defroutes reitit
  (cu/defapi :impersonointi nil :post "/impersonoi" [:as {session :session}, oid]
    {:status 200
     :session (assoc session :impersonoitu-oid oid)})

  (cu/defapi :impersonointi-lopetus nil :post "/lopeta-impersonointi" {session :session}
    {:status 200
     :session (dissoc session :impersonoitu-oid)})

  (cu/defapi :roolin-valinta nil :post "/rooli" {{rooli :rooli_organisaatio_id} :params
                                                 session :session}
    {:status 200
     :session (assoc session :rooli rooli)})

  (cu/defapi :impersonointi nil :get "/impersonoitava" [termi]
    (json-response (arkisto/hae-impersonoitava-termilla termi)))

  (cu/defapi :omat_tiedot nil :get "/" []
    (let [oikeudet (kayttajaoikeus-arkisto/hae-oikeudet (:aktiivinen-oid *kayttaja*))]
      (json-response (assoc oikeudet :impersonoitu_kayttaja (:impersonoidun-kayttajan-nimi *kayttaja*)
                                     :aktiivinen_rooli (:aktiivinen-rooli *kayttaja*)))))

  (cu/defapi :kayttajan_tiedot oid :get "/:oid" [oid]
    true))
