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

(defproject aipal "0.1.0-SNAPSHOT"
  :description "AIPAL"
  :dependencies [[cas-single-sign-out "0.1.2" :exclusions [clj-cas-client]]
                 [ch.qos.logback/logback-classic "1.0.13"]
                 [cheshire "5.4.0"]
                 [clj-http "1.0.1"]
                 [clj-time "0.9.0"]
                 [clojure-csv/clojure-csv "2.0.1"]
                 [clojurewerkz/quartzite "1.3.0"]
                 [com.cemerick/valip "0.3.2"]
                 [com.jolbox/bonecp "0.8.0.RELEASE"]
                 [compojure "1.4.0"]
                 [http-kit "2.1.18"]
                 [korma "0.4.0"]
                 [org.clojars.noidi/clj-cas-client "0.0.6-4ae43963cb458579a3813f9dda4fba52ad4d9607-ring-1.2.1" :exclusions [ring]]
                 [org.clojars.pntblnk/clj-ldap "0.0.9"]
                 [org.clojure/clojure "1.7.0"]
                 [org.clojure/core.cache "0.6.4"]
                 [org.clojure/tools.logging "0.2.6"]
                 [org.postgresql/postgresql "9.3-1101-jdbc41"]
                 [org.slf4j/slf4j-api "1.7.5"]
                 [peridot "0.3.0"]
                 [prismatic/schema "0.4.0"]
                 [ring/ring-core "1.2.1"]
                 [ring/ring-headers "0.1.0"]
                 [ring/ring-json "0.2.0"]
                 [ring/ring-session-timeout "0.1.0"]
                 [robert/hooke "1.3.0"]
                 [stencil "0.3.2"]]
  :plugins [[test2junit "1.0.1"]
            [codox "0.8.12"]
            [jonase/eastwood "0.2.3"]]
  :profiles {:dev {:source-paths ["dev"]
                   :dependencies [[org.clojure/tools.namespace "0.2.4"]
                                  [clj-webdriver "0.6.0"]
                                  [ring-mock "0.1.5"]
                                  [clj-gatling "0.4.1"]
                                  [org.clojure/test.check "0.5.9"]]}
             :uberjar {:main aipal.palvelin
                       :aot :all}
             :test {:resource-paths ["test-resources"]}}
  :source-paths ["src/clj" "clojure-utils/src/clj"]
  :java-source-paths ["src/java"]
  :javac-options ["-target" "1.7" "-source" "1.7"]
  :test-paths ["test/clj"]
  :test-selectors {:default  (complement (some-fn :integraatio :performance))
                   :integraatio (complement (some-fn :performance))
                   :performance :performance}
  :jar-name "aipal.jar"
  :uberjar-name "aipal-standalone.jar"
  :main aipal.palvelin
  :repl-options {:init-ns user})
