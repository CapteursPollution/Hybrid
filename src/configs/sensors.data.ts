import { Sensor } from '../models/sensor.interface';

export const SENSORS : Sensor[] = [
    {
        name : 'PMS5003',
        desc : '',
        image : 'assets/imgs/sensors/pms5003.png',
        pollutants: 'PM10, PM2.5'
    },
    {
        name : 'MQ2',
        desc : '',
        image : 'assets/imgs/sensors/mq2.bmp',
        pollutants: ''
    },
    {
        name : 'DHT22',
        desc : '',
        image : 'assets/imgs/sensors/dht22.jpg',
        pollutants: 'Temperature, Humidity'
    },
    {
        name : 'MISC',
        desc : '',
        image : 'assets/imgs/sensors/misc.png',
        pollutants: ''
    },
    {
        name : 'Microphone',
        desc : '',
        image : 'assets/imgs/sensors/microphone.jpg',
        pollutants: ''
    }
];