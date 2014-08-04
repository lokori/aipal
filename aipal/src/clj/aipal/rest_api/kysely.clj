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

(ns aipal.rest-api.kysely
  (:require [compojure.core :as c]
            [korma.db :as db]
            [schema.core :as schema]
            [aipal.arkisto.kysely :as kysely]
            [oph.common.util.http-util :refer [json-response]]))

(c/defroutes reitit
  (c/GET "/" [] (db/transaction
                  (json-response (kysely/hae-kaikki))))

  (c/GET "/:kyselyid" [kyselyid] (db/transaction
                                   (json-response (kysely/hae (Integer/parseInt kyselyid))))))
