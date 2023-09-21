set -eu pipefail


# create a cluster
kind create cluster --name watcher

# setup and install prometheus operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install --wait prometheus prometheus-community/kube-prometheus-stack \
--set kubelet.serviceMonitor.https=true \
--set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# helm the helm chart
helm install --wait watcher ./helm
