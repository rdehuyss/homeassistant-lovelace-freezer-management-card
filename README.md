## HA Card to manage your freezer.

### Prerequisites
There is currently no way to save data in the DB that survives HA restarts. That's why this card uses the `file notify service` and the `file sensor`.

To set this card up, make sure to have the following in your configuration:
```
notify:
  - name: diepvries
    platform: file
    filename: ./diepvries-contents.json
    
sensor:
  - platform: file
    name: diepvries-contents
    file_path: /config/diepvries-contents.json
```

### Card config
```yml
title: Diepvries
views:
  - cards:
      - type: custom:freezer-management-card
        contents_notify: notify.diepvries
        contents_sensor: sensor.diepvries_contents
        shortcuts:
          - Bolognese saus
          - Groentensoep
          - Tomatensoep
          - Vol-au-vent
          - Lasagne

```
