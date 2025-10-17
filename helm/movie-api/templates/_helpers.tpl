{{- define "movie-api.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "movie-api.chart" -}}
{{ .Chart.Name }}-{{ .Chart.Version }}
{{- end -}}

{{- define "movie-api.fullname" -}}
{{- printf "%s-%s" (include "movie-api.name" .) .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
