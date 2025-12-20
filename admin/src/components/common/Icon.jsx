import React, { useState, useEffect } from 'react';
import { ImageService } from '@services/ImageService';
import styles from './Icon.module.css';

const Icon = (props) => {
    const {
        name,
        className,
        // Usamos 24px como tamaño por defecto para iconos cuadrados
        size = 24,
        type = 'icon'
    } = props;
    
    const [svgContent, setSvgContent] = useState('');
    const svgUrl = ImageService.getImageURL(name);

    useEffect(() => {
        if (!svgUrl) return;

        fetch(svgUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error al cargar el SVG: ${response.statusText}`);
                }
                return response.text();
            })
            .then(svgText => {
                setSvgContent(svgText);
            })
            .catch(error => console.error(`Fallo al obtener el SVG para ${name}:`, error));

    }, [svgUrl, name]); // Dependencias: la URL y el nombre

    // Aplicar el tamaño usando estilos inline (propiedad más fuerte)
    const iconStyle = {
        width: (`${(type === 'flag' ? size * 1.3 : size)}px`),
        height: `${size}px`,
    };

    return (
        <div 
            style={iconStyle} 
            className={`${styles.iconContainer} ${className || ''}`}
            dangerouslySetInnerHTML={{ __html: svgContent }} 
        />
    );
}

export default Icon;