import { h } from 'preact';

export default function PluginSlots() {
    const hours = [6, 12, 3, 9, 2, 10, 4, 8, 1, 11, 5, 7];
    return (
        <div className="plugin-slots">
            {hours.map(hour => (
                <iframe
                    key={hour}
                    id={`slot-${hour}`}
                    style="display: none; width: 100%; height: 120px;"
                />
            ))}
        </div>
    );
}
