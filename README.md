### introduction

An application that monitors wallets on the kumama network and alerts when there is change in the wallet.

wallets are defined in addresses-config configmap

### usage

the nodejs application has been already built and pushed to my docker hub repository.
```
docker build -t watcher .
docker tag watcher:latest bmanu199/watcher:v2
docker push bmanu199/watcher:v2
```

just run:
```
start.sh
```

### components:

First installs k8s prometheus operator
Next installs mailhog operator so that AlertManager can send emails to this
Final install the application. In the format of helm templates.

We can see the alerts in alertmanager

```
kubectl port-forward svc/prometheus-kube-prometheus-alertmanager 9093:9093
```

### TODO:
* need to understand why the alert is not showing up in mailhog.

