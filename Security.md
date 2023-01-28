
## Run checker

```sh
docker run --rm --net host --pid host --userns host --cap-add audit_control \
    -e DOCKER_CONTENT_TRUST=$DOCKER_CONTENT_TRUST \
    -v /etc:/etc:ro \
    -v /lib/systemd/system:/lib/systemd/system:ro \
    -v /usr/bin/containerd:/usr/bin/containerd:ro \
    -v /usr/bin/runc:/usr/bin/runc:ro \
    -v /usr/lib/systemd:/usr/lib/systemd:ro \
    -v /var/lib:/var/lib:ro \
    -v /var/run/docker.sock:/var/run/docker.sock:ro \
    --label docker_bench_security \
    docker/docker-bench-security
```

## Issuses fixed

**For mores details, visit**
- https://github.com/docker/docker-bench-security
- https://www.digitalocean.com/community/tutorials/how-to-audit-docker-host-security-with-docker-bench-for-security-on-ubuntu-16-04

**Issuses**

- 1 - Host Configuration
    - 1.2 Ensure the container host has been Hardened
      - No root login via ssh
          - Add `PermitRootLogin no` to `/etc/ssh/sshd_config`, then restart sshd `sudo systemctl restart sshd`

    - 1.5–1.13 Ensure auditing is configured for various Docker files
        - Install auditd: `sudo apt-get install auditd`
        - Add rules to `/etc/audit/rules.d/audit.rules`

        ```
        -w /usr/bin/docker -p wa
        -w /var/lib/docker -p wa
        -w /etc/docker -p wa
        -w /lib/systemd/system/docker.service -p wa
        -w /run/containerd/containerd.sock -p wa
        -w /etc/default/docker -p wa
        -w /etc/docker/daemon.json -p wa
        -w /usr/bin/docker-containerd -p wa
        -w /usr/bin/docker-runc -p wa
        ```

        - Restart auditd `sudo systemctl restart auditd`

- 2 - Fix docker daemon configuration
    - Fix 2.1, 2.11, 2.12, 2.15, 2.18
    - Not fix 2.8, 2.14

- 4 - Container Images and Build File
    - 4.5 Ensure Content trust for Docker is Enabled (do not apply)

    ```sh
    export DOCKER_CONTENT_TRUST=1
    echo "DOCKER_CONTENT_TRUST=1" | sudo tee -a /etc/environment
    ```
