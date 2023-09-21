set -eu pipefail


# create a cluster
kind create cluster --name watcher

# setup and install prometheus operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add codecentric https://codecentric.github.io/helm-charts

helm repo update

helm install --wait prometheus prometheus-community/kube-prometheus-stack \
--set kubelet.serviceMonitor.https=true \
--set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
--set alertmanager.alertmanagerSpec.replicas=3

helm install mailhog codecentric/mailhog

# helm the helm chart
helm install --wait watcher ./helm

echo "wallet addresses are provided in the configmap named: addresses-config"

echo "One of the wallet JFKE9s3nvNu4p6P5u5qL2xz1j5b43ScwcAD8Bja1opWDj8k has zero balance in it"
echo "you could see the alert firing in the below email link. which open mailhog (a simple testing email client)"

export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=mailhog,app.kubernetes.io/instance=mailhog" -o jsonpath="{.items[0].metadata.name}")
kubectl port-forward --namespace default $POD_NAME 8025
