(ns aipalvastaus.asetukset
  (:require
    [schema.core :as s]
    [oph.common.infra.asetukset :refer [lue-asetukset]]))

(def Asetukset {:server {:port s/Int
                         :base-url s/Str}
                :development-mode Boolean
                :logback {:properties-file s/Str}
                :response-cache-max-age s/Int
                :aipal-base-url s/Str
                :db {:host s/Str
                     :port s/Int
                     :name s/Str
                     :user s/Str
                     :password s/Str
                     :maximum-pool-size s/Int
                     :minimum-pool-size s/Int}})

(def oletusasetukset
  {:server {:port 8083
            :base-url ""}
   :development-mode false ; oletusarvoisesti ei olla kehitysmoodissa. Pitää erikseen kääntää päälle jos tarvitsee kehitysmoodia.
   :logback {:properties-file "resources/logback.xml"}
   :response-cache-max-age 0
   :aipal-base-url "http://192.168.50.1:8082/"
   :db {:host "127.0.0.1"
        :port 3456
        :name "aipal"
        :user "aipalvastaus_user"
        :password "aipalvastaus"
        :maximum-pool-size 15
        :minimum-pool-size 3}})

(defn hae-asetukset []
  (lue-asetukset oletusasetukset Asetukset "aipalvastaus.properties"))
