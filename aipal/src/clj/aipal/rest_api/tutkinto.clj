;; Copyright (c) 2014 The Finnish National Board of Education - Opetushallitus
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

(ns aipal.rest-api.tutkinto
  (:require [compojure.core :as c]
            [aipal.compojure-util :as cu]
            [aipal.arkisto.tutkinto :as tutkinto]
            [oph.common.util.http-util :refer [json-response]]
            [aipal.infra.kayttaja :refer [*kayttaja*]]))

(c/defroutes reitit
  (cu/defapi :tutkinto nil :get "/voimassaolevat" []
    (json-response (tutkinto/hae-voimassaolevat-tutkinnot)))
  (cu/defapi :tutkinto nil :get "/vanhentuneet" []
    (json-response (tutkinto/hae-vanhentuneet-tutkinnot)))
  (cu/defapi :tutkinto nil :get "/koulutustoimija" []
    (let [y-tunnus (:aktiivinen-koulutustoimija *kayttaja*)]
      (json-response (tutkinto/hae-koulutustoimijan-tutkinnot y-tunnus)))))
